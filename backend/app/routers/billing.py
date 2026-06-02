"""
BILLING ROUTER
Handles Stripe checkout, subscription management, and plan updates.
"""

try:
    import stripe  # type: ignore
except ImportError:
    stripe = None  # type: ignore

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import update as sql_update
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.models import User, Chatbot

router = APIRouter(prefix="/api/billing", tags=["Billing"])

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Plan configuration
PLAN_CONFIG = {
    "free": {"max_chatbots": 2, "max_messages": 100},
    "starter": {"max_chatbots": 3, "max_messages": 3000},
    "business": {"max_chatbots": 6, "max_messages": 6000},
    "enterprise": {"max_chatbots": 999, "max_messages": 999999},
}

PRICE_TO_PLAN = {}
PLAN_TO_PRICE = {}


def _init_price_maps():
    """Build lookup maps between Stripe price IDs and plan names."""
    global PRICE_TO_PLAN, PLAN_TO_PRICE
    if settings.STRIPE_PRICE_STARTER:
        PRICE_TO_PLAN[settings.STRIPE_PRICE_STARTER] = "starter"
        PLAN_TO_PRICE["starter"] = settings.STRIPE_PRICE_STARTER
    if settings.STRIPE_PRICE_BUSINESS:
        PRICE_TO_PLAN[settings.STRIPE_PRICE_BUSINESS] = "business"
        PLAN_TO_PRICE["business"] = settings.STRIPE_PRICE_BUSINESS
    if settings.STRIPE_PRICE_ENTERPRISE:
        PRICE_TO_PLAN[settings.STRIPE_PRICE_ENTERPRISE] = "enterprise"
        PLAN_TO_PRICE["enterprise"] = settings.STRIPE_PRICE_ENTERPRISE


_init_price_maps()


def _update_user_plan(user: User, new_plan: str, db: Session):
    """Update user's plan and adjust all chatbot limits accordingly."""
    limits = PLAN_CONFIG.get(new_plan, PLAN_CONFIG["free"])

    db.execute(
        sql_update(User)
        .where(User.id == user.id)
        .values(plan=new_plan)
    )

    db.execute(
        sql_update(Chatbot)
        .where(Chatbot.user_id == user.id)
        .values(max_messages=limits["max_messages"])
    )

    db.commit()


def _get_or_create_stripe_customer(user: User, db: Session) -> str:
    """Get existing Stripe customer ID or create a new one."""
    if user.stripe_customer_id:
        return user.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        name=user.full_name,
        metadata={"user_id": str(user.id)}
    )

    db.execute(
        sql_update(User)
        .where(User.id == user.id)
        .values(stripe_customer_id=customer.id)
    )
    db.commit()

    return customer.id


@router.get("/info")
def get_billing_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current billing information for the logged-in user."""
    db.refresh(current_user)

    limits = PLAN_CONFIG.get(current_user.plan, PLAN_CONFIG["free"])

    chatbots = db.query(Chatbot).filter(Chatbot.user_id == current_user.id).all()
    total_messages_used = sum(bot.message_count for bot in chatbots)
    total_messages_limit = limits["max_messages"] * max(len(chatbots), 1)

    subscription_info = None
    if current_user.stripe_subscription_id:
        try:
            sub = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
            subscription_info = {
                "status": sub.status,
                "current_period_end": sub.current_period_end,
                "cancel_at_period_end": sub.cancel_at_period_end,
            }
        except Exception:
            subscription_info = None

    return {
        "plan": current_user.plan,
        "limits": limits,
        "usage": {
            "chatbots_used": len(chatbots),
            "chatbots_limit": limits["max_chatbots"],
            "messages_used": total_messages_used,
            "messages_limit": total_messages_limit,
        },
        "subscription": subscription_info,
        "stripe_publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
    }


@router.post("/create-checkout")
def create_checkout_session(
    plan: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a Stripe Checkout Session for upgrading to a paid plan."""
    if plan not in PLAN_TO_PRICE:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid plan: {plan}. Available: {list(PLAN_TO_PRICE.keys())}"
        )

    if current_user.plan == plan:
        raise HTTPException(status_code=400, detail="You are already on this plan")

    price_id = PLAN_TO_PRICE[plan]
    customer_id = _get_or_create_stripe_customer(current_user, db)

    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"https://YOUR-APP.vercel.app/dashboard/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"https://YOUR-APP.vercel.app/dashboard/billing/cancel",
            metadata={
                "user_id": str(current_user.id),
                "plan": plan,
            },
        )
        return {"checkout_url": session.url, "session_id": session.id}

    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-session")
def verify_checkout_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verify a completed checkout session and activate the plan.
    Called by the success page after Stripe redirects back.
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid session: {str(e)}")

    if session.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Payment not completed")

    plan = session.metadata.get("plan")
    if not plan or plan not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid plan in session")

    subscription_id = session.subscription

    db.execute(
        sql_update(User)
        .where(User.id == current_user.id)
        .values(
            stripe_subscription_id=subscription_id,
        )
    )
    db.commit()

    _update_user_plan(current_user, plan, db)

    db.refresh(current_user)

    return {
        "status": "success",
        "plan": plan,
        "message": f"Successfully upgraded to {plan} plan!"
    }


@router.post("/create-portal")
def create_customer_portal(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a Stripe Customer Portal session.
    The portal lets customers manage their subscription, update payment
    method, view invoices, and cancel — all hosted by Stripe.
    """
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No billing account found. You need to subscribe to a plan first."
        )

    try:
        session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=f"{settings.FRONTEND_URL}/dashboard/billing",
        )
        return {"portal_url": session.url}

    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cancel")
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel the current subscription (reverts to free at period end)."""
    if not current_user.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    try:
        stripe.Subscription.modify(
            current_user.stripe_subscription_id,
            cancel_at_period_end=True
        )
        return {"status": "canceling", "message": "Subscription will cancel at end of billing period"}

    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset-usage")
def reset_message_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset message counts for all chatbots (development helper)."""
    db.execute(
        sql_update(Chatbot)
        .where(Chatbot.user_id == current_user.id)
        .values(message_count=0)
    )
    db.commit()
    return {"status": "reset", "message": "All message counts reset to 0"}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Stripe webhook events.
    In production, Stripe sends events here when subscriptions change.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if settings.STRIPE_WEBHOOK_SECRET and settings.STRIPE_WEBHOOK_SECRET.startswith("whsec_"):
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.SignatureVerificationError):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    else:
        import json
        event = json.loads(payload)

    event_type = event.get("type", "")

    if event_type == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")

        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user:
            _update_user_plan(user, "free", db)
            db.execute(
                sql_update(User)
                .where(User.id == user.id)
                .values(stripe_subscription_id=None)
            )
            db.commit()

    elif event_type == "invoice.payment_failed":
        invoice = event["data"]["object"]
        customer_id = invoice.get("customer")
        print(f"⚠️ Payment failed for customer: {customer_id}")

    return {"status": "received"}