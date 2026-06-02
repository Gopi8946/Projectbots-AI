"""
CONVERSATIONS ROUTER
Browse, view, delete, and export customer conversations.
"""

import uuid
import csv
import io
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Chatbot, Conversation, Message
from app.schemas.schemas import ConversationListItem, ConversationDetail, MessageResponse

router = APIRouter(
    prefix="/api/chatbots/{chatbot_id}/conversations",
    tags=["Conversations"]
)


def _get_user_chatbot(chatbot_id: uuid.UUID, db: Session, current_user: User) -> Chatbot:
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot


def _build_conversation_item(conversation: Conversation, db: Session) -> ConversationListItem:
    """Build a list item from a conversation with computed fields."""
    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at).all()

    first_user_msg = None
    last_msg_time = None

    for msg in messages:
        if msg.role == "user" and first_user_msg is None:
            first_user_msg = msg.content[:100]
        last_msg_time = msg.created_at

    return ConversationListItem(
        id=conversation.id,
        session_id=conversation.session_id,
        message_count=len(messages),
        first_user_message=first_user_msg,
        last_message_at=last_msg_time,
        created_at=conversation.created_at,
    )


@router.get("/export")
def export_conversations_csv(
    chatbot_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export all conversations as a CSV file download."""
    chatbot = _get_user_chatbot(chatbot_id, db, current_user)

    conversations = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot.id
    ).order_by(Conversation.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Conversation ID", "Session ID", "Date", "Time", "Role", "Message"])

    for conv in conversations:
        messages = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(Message.created_at).all()

        for msg in messages:
            writer.writerow([
                str(conv.id)[:8],
                conv.session_id[:12],
                msg.created_at.strftime("%Y-%m-%d"),
                msg.created_at.strftime("%H:%M:%S"),
                msg.role,
                msg.content.replace("\n", " "),
            ])

    output.seek(0)

    filename = f"{chatbot.name.replace(' ', '_')}_conversations.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/", response_model=List[ConversationListItem])
def list_conversations(
    chatbot_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all conversations for a chatbot, most recent first."""
    chatbot = _get_user_chatbot(chatbot_id, db, current_user)

    conversations = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot.id
    ).order_by(Conversation.created_at.desc()).limit(100).all()

    return [_build_conversation_item(conv, db) for conv in conversations]


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation_detail(
    chatbot_id: uuid.UUID,
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single conversation with all its messages."""
    chatbot = _get_user_chatbot(chatbot_id, db, current_user)

    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.chatbot_id == chatbot.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at).all()

    return ConversationDetail(
        id=conversation.id,
        session_id=conversation.session_id,
        created_at=conversation.created_at,
        messages=[MessageResponse.model_validate(m) for m in messages],
    )


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(
    chatbot_id: uuid.UUID,
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a single conversation and all its messages."""
    chatbot = _get_user_chatbot(chatbot_id, db, current_user)

    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.chatbot_id == chatbot.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()
    return None