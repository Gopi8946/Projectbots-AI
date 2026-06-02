"""
PUBLIC CHAT API — With domain whitelisting security.
Only allows requests from owner-approved domains.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Chatbot, Conversation, Message
from app.schemas.schemas import (
    PublicChatRequest, PublicChatResponse, WidgetConfigResponse
)
from app.services.rag_service import get_rag_response
from app.services.domain_service import is_domain_allowed

router = APIRouter(prefix="/api/public", tags=["Public Chat (Widget)"])


def _get_chatbot_by_key(api_key: str, db: Session) -> Chatbot:
    chatbot = db.query(Chatbot).filter(Chatbot.api_key == api_key).first()
    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found. Check your API key."
        )
    return chatbot


def _check_domain(request: Request, chatbot: Chatbot):
    """Validate request comes from an approved domain."""
    origin = request.headers.get("origin", "")
    referer = request.headers.get("referer", "")

    allowed, reason = is_domain_allowed(
        origin=origin,
        referer=referer,
        allowed_domains=chatbot.allowed_domains
    )

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This chatbot is not authorized for this domain. Add your domain in the Deploy tab."
        )

    return reason


@router.get("/config/{api_key}", response_model=WidgetConfigResponse)
def get_widget_config(
    api_key: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get widget configuration. Checks domain authorization."""
    chatbot = _get_chatbot_by_key(api_key, db)
    db.refresh(chatbot)

    _check_domain(request, chatbot)

    widget = chatbot.widget_settings if chatbot.widget_settings else {}

    return WidgetConfigResponse(
        bot_name=chatbot.name,
        description=chatbot.description or "",
        greeting_message=widget.get("greeting_message", "Hi! 👋 How can I help you today?"),
        primary_color=widget.get("primary_color", "#6366f1"),
        position=widget.get("position", "right"),
        bubble_text=widget.get("bubble_text", "Chat with us"),
        show_branding=widget.get("show_branding", True),
        status=chatbot.status,
    )


@router.post("/chat/{api_key}", response_model=PublicChatResponse)
async def public_chat_message(
    api_key: str,
    data: PublicChatRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle chat message from widget. Domain-protected."""
    chatbot = _get_chatbot_by_key(api_key, db)

    # Domain check
    _check_domain(request, chatbot)

    # Status check
    if chatbot.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This chatbot is not currently active."
        )

    # Rate limit check
    if chatbot.message_count >= chatbot.max_messages:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Monthly message limit reached."
        )

    session_id = data.session_id or str(uuid.uuid4())

    conversation = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot.id,
        Conversation.session_id == session_id
    ).first()

    if not conversation:
        conversation = Conversation(chatbot_id=chatbot.id, session_id=session_id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=data.message
    )
    db.add(user_msg)
    db.commit()

    previous_messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at).all()

    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in previous_messages[:-1]
    ]

    result = await get_rag_response(
        chatbot_name=chatbot.name,
        chatbot_id=str(chatbot.id),
        personality=chatbot.personality,
        custom_system_prompt=chatbot.system_prompt,
        user_message=data.message,
        conversation_history=conversation_history if conversation_history else None
    )

    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=result["response"]
    )
    db.add(assistant_msg)
    chatbot.message_count += 1
    db.commit()

    return PublicChatResponse(
        response=result["response"],
        session_id=session_id
    )