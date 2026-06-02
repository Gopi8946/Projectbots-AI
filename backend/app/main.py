from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import (
    auth, chatbots, data_sources, chat,
    public_chat, conversations, analytics,
    billing, voice, tools, whatsapp
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ELEVENLABS_API_KEY and settings.ELEVENLABS_VOICE_ID:
        from app.services.elevenlabs_service import warm_up_common_phrases
        await warm_up_common_phrases()
    yield


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Custom Chatbot Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chatbots.router)
app.include_router(data_sources.router)
app.include_router(chat.router)
app.include_router(public_chat.router)
app.include_router(conversations.router)
app.include_router(analytics.router)
app.include_router(billing.router)
app.include_router(voice.router)
app.include_router(tools.router)
app.include_router(whatsapp.router)


@app.get("/", tags=["Health"])
def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}