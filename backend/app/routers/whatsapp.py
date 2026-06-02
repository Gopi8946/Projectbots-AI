"""
WHATSAPP INTEGRATION
Uses Twilio WhatsApp API.
For testing: Twilio Sandbox (instant, no Meta approval)
For production: Meta Business API (needs verification)
"""

import uuid
from fastapi import APIRouter, Depends, Form, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.models import Chatbot, Conversation, Message
from app.services.rag_service import get_rag_response

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp"])


def _get_chatbot_by_key(api_key: str, db: Session) -> Chatbot:
    return db.query(Chatbot).filter(Chatbot.api_key == api_key).first()


def _twilio_response(message: str) -> Response:
    """Return TwiML MessagingResponse for WhatsApp."""
    twiml = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{message}</Message>
</Response>'''
    return Response(content=twiml, media_type="text/xml")


@router.post("/incoming/{api_key}")
async def handle_whatsapp_message(
    api_key: str,
    Body: str = Form(default=""),
    From: str = Form(default=""),
    WaId: str = Form(default=""),
    db: Session = Depends(get_db)
):
    """
    Handle incoming WhatsApp message via Twilio webhook.
    Same RAG pipeline as chat and voice.
    """
    chatbot = _get_chatbot_by_key(api_key, db)
    if not chatbot:
        return _twilio_response("Sorry, this chatbot is not configured correctly.")

    if chatbot.status != "active":
        return _twilio_response("This chatbot is not currently active.")

    if chatbot.message_count >= chatbot.max_messages:
        return _twilio_response("This chatbot has reached its monthly message limit.")

    customer_text = Body.strip()
    if not customer_text:
        return _twilio_response("Hi! How can I help you today?")

    # Use WhatsApp number as session ID (persistent per user)
    session_id = f"whatsapp_{WaId or From.replace('whatsapp:', '').replace('+', '')}"

    # Get or create conversation
    conversation = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot.id,
        Conversation.session_id == session_id
    ).first()

    if not conversation:
        conversation = Conversation(
            chatbot_id=chatbot.id,
            session_id=session_id,
            channel="whatsapp"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Save customer message
    db.add(Message(conversation_id=conversation.id, role="user", content=customer_text))
    db.commit()

    # Build conversation history
    all_messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at).all()

    history = [
        {"role": m.role, "content": m.content}
        for m in all_messages[:-1]
    ]

    # Run RAG pipeline
    result = await get_rag_response(
        chatbot_name=chatbot.name,
        chatbot_id=str(chatbot.id),
        personality=chatbot.personality,
        custom_system_prompt=chatbot.system_prompt,
        user_message=customer_text,
        conversation_history=history if history else None,
    )

    response_text = result["response"]

    # Save bot response
    db.add(Message(conversation_id=conversation.id, role="assistant", content=response_text))
    chatbot.message_count += 1
    db.commit()

    # WhatsApp has 1600 char limit per message
    if len(response_text) > 1600:
        response_text = response_text[:1597] + "..."

    return _twilio_response(response_text)


@router.get("/test/{api_key}")
async def test_whatsapp(api_key: str, db: Session = Depends(get_db)):
    """Verify WhatsApp webhook is reachable."""
    chatbot = _get_chatbot_by_key(api_key, db)
    if not chatbot:
        return {"status": "error", "message": "Chatbot not found"}
    return {
        "status": "ok",
        "chatbot": chatbot.name,
        "webhook_url": f"Configure this in Twilio WhatsApp Sandbox",
        "message": "WhatsApp webhook is working!"
    }