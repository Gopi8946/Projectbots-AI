"""
ANALYTICS ROUTER
Provides stats, charts, and insights for a chatbot.
"""

import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast
from sqlalchemy.types import Date as DateType
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Chatbot, Conversation, Message
from app.schemas.schemas import AnalyticsResponse, ConversationListItem

router = APIRouter(tags=["Analytics"])

HOUR_LABELS = [
    "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM",
    "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
    "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM",
    "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM",
]


@router.get("/api/chatbots/{chatbot_id}/analytics", response_model=AnalyticsResponse)
def get_chatbot_analytics(
    chatbot_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive analytics for a chatbot."""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    # ── Basic counts ──────────────────────────────────
    total_conversations = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot.id
    ).count()

    total_messages = db.query(Message).join(Conversation).filter(
        Conversation.chatbot_id == chatbot.id
    ).count()

    user_messages = db.query(Message).join(Conversation).filter(
        Conversation.chatbot_id == chatbot.id,
        Message.role == "user"
    ).count()

    bot_messages = db.query(Message).join(Conversation).filter(
        Conversation.chatbot_id == chatbot.id,
        Message.role == "assistant"
    ).count()

    avg_messages = round(total_messages / max(total_conversations, 1), 1)

    # ── Messages per day (last 30 days) ───────────────
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    daily_results = db.query(
        cast(Message.created_at, DateType).label("date"),
        func.count(Message.id).label("count")
    ).join(Conversation).filter(
        Conversation.chatbot_id == chatbot.id,
        Message.created_at >= thirty_days_ago
    ).group_by(
        cast(Message.created_at, DateType)
    ).order_by(
        cast(Message.created_at, DateType)
    ).all()

    # Fill in zeros for days with no messages
    daily_dict = {}
    for i in range(30):
        day = (datetime.utcnow() - timedelta(days=29 - i)).date()
        daily_dict[str(day)] = 0
    for row in daily_results:
        daily_dict[str(row.date)] = row.count

    messages_per_day = [
        {"date": d, "count": c} for d, c in daily_dict.items()
    ]

    # ── Hourly distribution ───────────────────────────
    hourly_results = db.query(
        func.extract("hour", Message.created_at).label("hour"),
        func.count(Message.id).label("count")
    ).join(Conversation).filter(
        Conversation.chatbot_id == chatbot.id
    ).group_by(
        func.extract("hour", Message.created_at)
    ).all()

    hourly_dict = {i: 0 for i in range(24)}
    for row in hourly_results:
        hourly_dict[int(row.hour)] = row.count

    hourly_distribution = [
        {"hour": h, "label": HOUR_LABELS[h], "count": c}
        for h, c in sorted(hourly_dict.items())
    ]

    # ── Top questions (unique user messages) ──────────
    recent_user_msgs = db.query(Message.content).join(Conversation).filter(
        Conversation.chatbot_id == chatbot.id,
        Message.role == "user"
    ).order_by(Message.created_at.desc()).limit(50).all()

    # Deduplicate while preserving order
    seen = set()
    top_questions = []
    for row in recent_user_msgs:
        text = row.content.strip()[:120]
        lower = text.lower()
        if lower not in seen:
            seen.add(lower)
            top_questions.append(text)
        if len(top_questions) >= 15:
            break

    # ── Recent conversations ──────────────────────────
    recent_convs = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot.id
    ).order_by(Conversation.created_at.desc()).limit(5).all()

    recent_items = []
    for conv in recent_convs:
        messages_list = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(Message.created_at).all()

        first_user = None
        last_time = None
        for m in messages_list:
            if m.role == "user" and first_user is None:
                first_user = m.content[:100]
            last_time = m.created_at

        recent_items.append(ConversationListItem(
            id=conv.id,
            session_id=conv.session_id,
            message_count=len(messages_list),
            first_user_message=first_user,
            last_message_at=last_time,
            created_at=conv.created_at,
        ))

    return AnalyticsResponse(
        total_conversations=total_conversations,
        total_messages=total_messages,
        user_messages=user_messages,
        bot_messages=bot_messages,
        avg_messages_per_conversation=avg_messages,
        messages_per_day=messages_per_day,
        hourly_distribution=hourly_distribution,
        top_questions=top_questions,
        recent_conversations=recent_items,
    )