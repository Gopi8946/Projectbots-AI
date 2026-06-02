from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ─── USER SCHEMAS ────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    company_name: Optional[str]
    plan: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── CHATBOT SCHEMAS ────────────────────────────────────

class ChatbotCreate(BaseModel):
    name: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    personality: Optional[str] = "professional"


class ChatbotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    personality: Optional[str] = None
    status: Optional[str] = None
    allowed_topics: Optional[List[str]] = None
    widget_settings: Optional[dict] = None


class ChatbotResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    system_prompt: Optional[str]
    personality: str
    status: str
    api_key: str
    widget_settings: Optional[dict] = None
    voice_settings: Optional[dict] = None
    allowed_domains: Optional[List[str]] = None
    message_count: int
    max_messages: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── DATA SOURCE SCHEMAS ────────────────────────────────

class DataSourceTextCreate(BaseModel):
    name: str
    content: str


class DataSourceResponse(BaseModel):
    id: UUID
    chatbot_id: UUID
    type: str
    name: str
    original_filename: Optional[str]
    content_preview: Optional[str]
    chunk_count: int
    character_count: int
    status: str
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── CHAT SCHEMAS (Owner Dashboard) ─────────────────────

class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatSource(BaseModel):
    content: str
    source_name: str
    relevance_score: float


class ChatMessageResponse(BaseModel):
    response: str
    session_id: str
    sources: List[ChatSource]


class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    sources: Optional[List[dict]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── PUBLIC CHAT SCHEMAS (Widget) ────────────────────────

class PublicChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class PublicChatResponse(BaseModel):
    response: str
    session_id: str


class WidgetConfigResponse(BaseModel):
    bot_name: str
    description: str
    greeting_message: str
    primary_color: str
    position: str
    bubble_text: str
    show_branding: bool
    status: str


# ─── CONVERSATION SCHEMAS ───────────────────────────────

class ConversationListItem(BaseModel):
    id: UUID
    session_id: str
    message_count: int
    first_user_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    created_at: datetime


class ConversationDetail(BaseModel):
    id: UUID
    session_id: str
    created_at: datetime
    messages: List[MessageResponse]


# ─── ANALYTICS SCHEMAS ──────────────────────────────────

class DailyCount(BaseModel):
    date: str
    count: int


class HourlyCount(BaseModel):
    hour: int
    label: str
    count: int


class AnalyticsResponse(BaseModel):
    total_conversations: int
    total_messages: int
    user_messages: int
    bot_messages: int
    avg_messages_per_conversation: float
    messages_per_day: List[DailyCount]
    hourly_distribution: List[HourlyCount]
    top_questions: List[str]
    recent_conversations: List[ConversationListItem]