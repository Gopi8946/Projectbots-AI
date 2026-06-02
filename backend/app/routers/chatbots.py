import uuid
import os
import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import update as sql_update
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Chatbot
from app.schemas.schemas import ChatbotCreate, ChatbotUpdate, ChatbotResponse




router = APIRouter(prefix="/api/chatbots", tags=["Chatbots"])

PLAN_LIMITS = {
    "free": {"max_chatbots": 2, "max_messages": 100},
    "starter": {"max_chatbots": 3, "max_messages": 3000},
    "business": {"max_chatbots": 6, "max_messages": 6000},
    "enterprise": {"max_chatbots": 999, "max_messages": 999999},
}


def generate_api_key() -> str:
    return f"pb_live_{secrets.token_urlsafe(32)}"


@router.post("/", response_model=ChatbotResponse, status_code=201)
def create_chatbot(
    chatbot_data: ChatbotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    limits = PLAN_LIMITS.get(current_user.plan, PLAN_LIMITS["free"])
    existing_count = db.query(Chatbot).filter(Chatbot.user_id == current_user.id).count()

    if existing_count >= limits["max_chatbots"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your {current_user.plan} plan allows only {limits['max_chatbots']} chatbot(s). Please upgrade."
        )

    default_widget = {
        "greeting_message": "Hi! 👋 How can I help you today?",
        "primary_color": "#6366f1",
        "position": "right",
        "bubble_text": "Chat with us",
        "show_branding": True,
    }

    new_chatbot = Chatbot(
        user_id=current_user.id,
        name=chatbot_data.name,
        description=chatbot_data.description,
        system_prompt=chatbot_data.system_prompt,
        personality=chatbot_data.personality or "professional",
        api_key=generate_api_key(),
        max_messages=limits["max_messages"],
        status="draft",
        widget_settings=default_widget
    )

    db.add(new_chatbot)
    db.commit()
    db.refresh(new_chatbot)

    return ChatbotResponse.model_validate(new_chatbot)


@router.get("/", response_model=List[ChatbotResponse])
def list_chatbots(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chatbots = db.query(Chatbot).filter(
        Chatbot.user_id == current_user.id
    ).order_by(Chatbot.created_at.desc()).all()
    return [ChatbotResponse.model_validate(bot) for bot in chatbots]


@router.get("/{chatbot_id}", response_model=ChatbotResponse)
def get_chatbot(
    chatbot_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return ChatbotResponse.model_validate(chatbot)


@router.patch("/{chatbot_id}", response_model=ChatbotResponse)
def update_chatbot(
    chatbot_id: uuid.UUID,
    update_data: ChatbotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    update_dict = update_data.model_dump(exclude_unset=True)

    # Remove widget_settings from general update — use dedicated endpoint
    update_dict.pop("widget_settings", None)
    update_dict.pop("allowed_topics", None)

    if update_dict:
        db.execute(
            sql_update(Chatbot)
            .where(Chatbot.id == chatbot_id)
            .values(**update_dict)
        )
        db.commit()

    db.refresh(chatbot)
    return ChatbotResponse.model_validate(chatbot)


@router.put("/{chatbot_id}/widget-settings")
def update_widget_settings(
    chatbot_id: uuid.UUID,
    settings: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Dedicated endpoint for widget settings.
    Uses raw SQL update to bypass SQLAlchemy JSON tracking issues.
    """
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    # Direct SQL update — guaranteed to write to database
    db.execute(
        sql_update(Chatbot)
        .where(Chatbot.id == chatbot_id)
        .values(widget_settings=settings)
    )
    db.commit()

    # Read back fresh from database to confirm
    db.refresh(chatbot)

    return {
        "status": "saved",
        "widget_settings": chatbot.widget_settings
    }


@router.put("/{chatbot_id}/allowed-domains")
def update_allowed_domains(
    chatbot_id: uuid.UUID,
    domains: List[str] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the list of domains allowed to use this chatbot's widget."""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()

    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    # Clean domains
    cleaned = []
    for domain in domains:
        d = domain.strip().lower()
        d = d.replace("https://", "").replace("http://", "").rstrip("/")
        if d:
            cleaned.append(d)

    db.execute(
        sql_update(Chatbot)
        .where(Chatbot.id == chatbot_id)
        .values(allowed_domains=cleaned)
    )
    db.commit()

    return {"status": "saved", "allowed_domains": cleaned}




@router.delete("/{chatbot_id}", status_code=204)
def delete_chatbot(
    chatbot_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.services.vector_store import delete_collection

    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    for source in chatbot.data_sources:
        if source.file_path and os.path.exists(source.file_path):
            os.remove(source.file_path)

    delete_collection(str(chatbot.id))
    db.delete(chatbot)
    db.commit()
    return None