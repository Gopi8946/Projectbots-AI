import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Chatbot, Conversation, Message
from app.schemas.schemas import (
    ChatMessageRequest, ChatMessageResponse, ChatSource, MessageResponse
)
from app.services.rag_service import get_rag_response
from app.services.llm_service import check_ollama_health

router = APIRouter(prefix="/api/chatbots/{chatbot_id}/chat", tags=["Chat"])


@router.post("/", response_model=ChatMessageResponse)
async def send_message(
    chatbot_id: uuid.UUID,
    message_data: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to a chatbot and get an AI-generated response.
    This is the core chat endpoint — the owner's testing playground.
    """
    # Verify chatbot belongs to user
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()

    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    # Get or create session
    session_id = message_data.session_id or str(uuid.uuid4())

    # Find or create conversation
    conversation = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot.id,
        Conversation.session_id == session_id
    ).first()

    if not conversation:
        conversation = Conversation(
            chatbot_id=chatbot.id,
            session_id=session_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Save the user's message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=message_data.message
    )
    db.add(user_msg)
    db.commit()

    # Build conversation history from previous messages
    previous_messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at).all()

    # Format history for the LLM (exclude the message we just saved — it's the current one)
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in previous_messages[:-1]  # All except the last (current) one
    ]

    # Run the RAG pipeline
    result = await get_rag_response(
        chatbot_name=chatbot.name,
        chatbot_id=str(chatbot.id),
        personality=chatbot.personality,
        custom_system_prompt=chatbot.system_prompt,
        user_message=message_data.message,
        conversation_history=conversation_history if conversation_history else None
    )

    # Save the assistant's response
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=result["response"],
        sources=result["sources"]
    )
    db.add(assistant_msg)

    # Increment message count
    chatbot.message_count += 1
    db.commit()

    # Build response
    sources = [
        ChatSource(
            content=s["content"],
            source_name=s["source_name"],
            relevance_score=s["relevance_score"]
        )
        for s in result["sources"]
    ]

    return ChatMessageResponse(
        response=result["response"],
        session_id=session_id,
        sources=sources
    )


@router.get("/history/{session_id}", response_model=List[MessageResponse])
def get_chat_history(
    chatbot_id: uuid.UUID,
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the full conversation history for a session."""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()

    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    conversation = db.query(Conversation).filter(
        Conversation.chatbot_id == chatbot.id,
        Conversation.session_id == session_id
    ).first()

    if not conversation:
        return []

    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at).all()

    return [MessageResponse.model_validate(m) for m in messages]


@router.get("/health")
async def chat_health_check(chatbot_id: uuid.UUID):
    """Check if Ollama is running and the model is available."""
    health = await check_ollama_health()
    return health