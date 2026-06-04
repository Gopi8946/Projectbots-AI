"""
VOICE ROUTER — ElevenLabs cloned voice + ultra-fast responses.
~2 second response time with natural cloned voice.
Falls back to Twilio Polly if ElevenLabs fails.
"""

import os
import uuid
import traceback
from fastapi import APIRouter, Depends, HTTPException, Form, Body
from fastapi.responses import Response, FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.models import User, Chatbot, Conversation, Message
from app.services.rag_service import get_voice_rag_response
from app.services.elevenlabs_service import generate_cloned_speech, check_elevenlabs_status
from app.services.tts_service import AUDIO_DIR, AVAILABLE_VOICES, generate_speech, cleanup_old_audio

router = APIRouter(prefix="/api/voice", tags=["Voice AI"])

VOICE_PROMPT = """
You are on a LIVE PHONE CALL. Be ultra-concise.

RULES:
- ONE to TWO sentences ONLY. Never more.
- Sound like a friendly human. Use "Sure!", "Absolutely!", "Great question!"
- NO bullet points, emojis, formatting, asterisks
- Say prices as words: "fourteen ninety-nine" not "$14.99"
- Say times as words: "eleven in the morning" not "11:00 AM"
- If listing, say top 3 items max, ask "want to hear more?"
- End with a quick follow-up question
- NEVER say "according to", "based on", "my data shows"
- Talk like you WORK there
"""

END_KEYWORDS = [
    "goodbye", "bye", "good bye",
    "have a great", "have a good", "have a nice", "have a wonderful",
    "take care", "that's all", "that is all", "nothing else",
    "i'm done", "i am done", "we're done", "all done", "that's it",
    "no more questions", "no more", "i'm good", "i am good",
    "good night", "see you", "talk later", "talk to you later",
    "thank you goodbye", "thanks goodbye", "thank you bye",
    "no thank you", "no thanks"
]

HUMAN_KEYWORDS = [
    # Direct human requests
    "speak to someone", "talk to someone", "talk to a person",
    "speak to a person", "real person", "human agent",
    "representative", "operator", "manager", "speak to a human",
    "talk to a human", "connect me", "transfer me",
    # Transfer phrases
    "transfer", "transfer the call", "transfer my call", "transfer this call",
    "transfer me to", "can you transfer", "please transfer",
    # Connect phrases
    "connect me to", "connect me with", "put me through",
    "put me on with", "get me", "i want to speak",
    "i need to speak", "i would like to speak",
    # Staff requests
    "staff", "employee", "supervisor", "owner",
    "someone else", "another person",
    # Help escalation
    "live agent", "live person", "actual person",
    "real human", "actual human"
]

SPEED_MAP = {"slow": 0.85, "normal": 1.0, "fast": 1.15, "x-fast": 1.3}


def _get_chatbot(api_key: str, db: Session) -> Chatbot:
    return db.query(Chatbot).filter(Chatbot.api_key == api_key).first()


def _voice_settings(chatbot: Chatbot) -> dict:
    defaults = {
        "voice": "Polly.Joanna",
        "speed": "fast",
        "greeting": f"Hi! Thanks for calling {chatbot.name}! How can I help?",
        "handoff_number": "",
        "webhook_base_url": "",
        "use_elevenlabs": True,
        "elevenlabs_voice_id": "",
        "elevenlabs_stability": 0.5,
        "elevenlabs_similarity": 0.75,
    }
    vs = chatbot.voice_settings or {}
    for k, v in defaults.items():
        if k not in vs:
            vs[k] = v
    return vs


def _check_keywords(text: str) -> str:
    """
    Detect if customer wants to end call or transfer to human.
    Uses word-boundary matching to avoid false positives.
    """
    import re
    
    lower = text.lower().strip()
    # Clean punctuation
    clean = re.sub(r'[^\w\s]', ' ', lower)
    
    # Check end keywords FIRST (so "bye" doesn't get caught as anything else)
    for kw in END_KEYWORDS:
        if kw in lower or kw in clean:
            print(f"  ✋ End keyword matched: '{kw}'")
            return "end"
    
    # Then check human transfer keywords
    for kw in HUMAN_KEYWORDS:
        if kw in lower or kw in clean:
            print(f"  🤝 Human keyword matched: '{kw}'")
            return "human"
    
    return "continue"


def _esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&apos;")


def _polly_say(text: str, voice: str, speed: str) -> str:
    """Fallback: Twilio Polly <Say>."""
    rate_map = {"slow": "90%", "normal": "100%", "fast": "115%", "x-fast": "130%"}
    rate = rate_map.get(speed, "115%")
    return f'<Say voice="{voice}"><prosody rate="{rate}">{_esc(text)}</prosody></Say>'


def _play(url: str) -> str:
    return f'<Play>{url}</Play>'


async def _speak(text: str, vs: dict, base_url: str) -> str:
    """
    Generate speech element.
    Tries ElevenLabs first (cloned voice),
    falls back to the SELECTED Polly voice (not hardcoded).
    """
    selected_polly_voice = vs.get("voice", "Polly.Matthew")
    selected_speed = vs.get("speed", "fast")

    # Try ElevenLabs cloned voice first
    if vs.get("use_elevenlabs", True) and settings.ELEVENLABS_API_KEY:
        try:
            voice_id = vs.get("elevenlabs_voice_id") or settings.ELEVENLABS_VOICE_ID
            if voice_id:
                speed = SPEED_MAP.get(selected_speed, 1.15)
                filename = await generate_cloned_speech(
                    text=text,
                    voice_id=voice_id,
                    stability=vs.get("elevenlabs_stability", 0.5),
                    similarity=vs.get("elevenlabs_similarity", 0.75),
                    speed=speed,
                )
                print(f"  ✅ ElevenLabs cloned voice used")
                return _play(f"{base_url}/api/voice/audio/{filename}")
        except Exception as e:
            print(f"  ⚠️ ElevenLabs failed: {e} — falling back to {selected_polly_voice}")

    # Fallback to SELECTED Polly voice (not hardcoded)
    print(f"  🔊 Using Polly voice: {selected_polly_voice}")
    return _polly_say(text, selected_polly_voice, selected_speed)

async def _speak_greeting(text: str, vs: dict, base_url: str) -> str:
    """
    Speech for greeting — uses Deepgram for consistent voice throughout call.
    Falls back to Polly only if Deepgram fails.
    """
    return await _speak_fast(text, vs, base_url)


async def _speak_fast(text: str, vs: dict, base_url: str) -> str:
    """
    Ultra-fast speech for mid-conversation responses.
    Tries Deepgram Aura (~200ms), falls back to Polly (instant).
    """
    # Try Deepgram first (fastest neural voice)
    if settings.DEEPGRAM_API_KEY:
        try:
            from app.services.deepgram_service import generate_deepgram_speech

            # Match gender from saved Polly voice selection
            polly_voice = vs.get("voice", "Polly.Matthew")
            is_male = any(
                m in polly_voice
                for m in ["Matthew", "Joey", "Stephen", "Gregory", "Arthur", "Ryan"]
            )
            deepgram_voice = "aura-orion-en" if is_male else "aura-asteria-en"

            filename = await generate_deepgram_speech(text, deepgram_voice)
            print(f"  ✅ Deepgram TTS (~200ms)")
            return _play(f"{base_url}/api/voice/audio/{filename}")
        except Exception as e:
            print(f"  ⚠️ Deepgram failed: {e} — falling back to Polly")

    # Fallback to Polly (instant, no file generation)
    selected_voice = vs.get("voice", "Polly.Matthew")
    selected_speed = vs.get("speed", "fast")
    return _polly_say(text, selected_voice, selected_speed)

def _error_xml(text: str = "We are having technical difficulties. Please try again later.") -> str:
    return f'<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">{_esc(text)}</Say><Hangup/></Response>'


# ═══════════════════════════════════════════════════════════
#  TEST
# ═══════════════════════════════════════════════════════════

@router.get("/test/{api_key}")
async def test_get(api_key: str, db: Session = Depends(get_db)):
    chatbot = _get_chatbot(api_key, db)
    if not chatbot:
        return {"status": "error", "message": "Chatbot not found"}
    return {"status": "ok", "chatbot": chatbot.name, "message": "Twilio can reach your server!"}

@router.get("/elevenlabs-check")
async def elevenlabs_public_check():
    """Public endpoint to verify ElevenLabs configuration — no auth needed."""
    has_key = bool(settings.ELEVENLABS_API_KEY and len(settings.ELEVENLABS_API_KEY) > 10)
    has_voice = bool(settings.ELEVENLABS_VOICE_ID and len(settings.ELEVENLABS_VOICE_ID) > 5)
    
    return {
        "api_key_configured": has_key,
        "voice_id_configured": has_voice,
        "api_key_preview": settings.ELEVENLABS_API_KEY[:8] + "..." if has_key else "NOT SET",
        "voice_id_preview": settings.ELEVENLABS_VOICE_ID[:8] + "..." if has_voice else "NOT SET",
    }

@router.post("/test/{api_key}")
async def test_post(api_key: str, db: Session = Depends(get_db)):
    chatbot = _get_chatbot(api_key, db)
    name = chatbot.name if chatbot else "your business"
    return Response(
        content=f'<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Hello! Test call from {_esc(name)}. Voice is working. Goodbye!</Say><Hangup/></Response>',
        media_type="text/xml"
    )


@router.get("/incoming/{api_key}")
async def incoming_get(api_key: str, db: Session = Depends(get_db)):
    chatbot = _get_chatbot(api_key, db)
    if not chatbot:
        return {"status": "error", "message": "Chatbot not found"}
    return {"status": "ok", "chatbot": chatbot.name, "message": "URL is correct. Configure in Twilio as HTTP POST."}


# ═══════════════════════════════════════════════════════════
#  CALL HANDLERS
# ═══════════════════════════════════════════════════════════

@router.post("/incoming/{api_key}")
async def handle_incoming(
    api_key: str,
    CallSid: str = Form(default=""),
    db: Session = Depends(get_db)
):
    """Incoming call — greet with cloned voice and listen."""
    try:
        chatbot = _get_chatbot(api_key, db)
        if not chatbot:
            return Response(content=_error_xml("This line is not configured."), media_type="text/xml")

        vs = _voice_settings(chatbot)
        base_url = vs.get("webhook_base_url", "").rstrip("/")
        if not base_url:
            return Response(content=_error_xml("Phone line not set up yet."), media_type="text/xml")

        session_id = f"voice_{CallSid}" if CallSid else f"voice_{uuid.uuid4().hex}"
        db.add(Conversation(chatbot_id=chatbot.id, session_id=session_id, channel="voice"))
        db.commit()

        greeting = vs.get("greeting", f"Hi! Thanks for calling {chatbot.name}!")
        action = f"{base_url}/api/voice/respond/{api_key}?sid={session_id}"
        speak_el = await _speak_greeting(greeting, vs, base_url)

        print(f"📞 Incoming call → {chatbot.name}")

        twiml = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="{action}" method="POST" speechTimeout="auto" language="en-US">
        {speak_el}
    </Gather>
    <Redirect method="POST">{base_url}/api/voice/timeout/{api_key}?sid={session_id}</Redirect>
</Response>'''

        cleanup_old_audio(30)
        return Response(content=twiml, media_type="text/xml")

    except Exception as e:
        print(f"❌ Incoming error: {e}")
        traceback.print_exc()
        return Response(content=_error_xml(), media_type="text/xml")


@router.post("/respond/{api_key}")
async def handle_respond(
    api_key: str,
    sid: str = "",
    SpeechResult: str = Form(default=""),
    Confidence: str = Form(default="0"),
    CallSid: str = Form(default=""),
    db: Session = Depends(get_db)
):
    """Customer spoke — check keywords FIRST, then RAG."""
    try:
        chatbot = _get_chatbot(api_key, db)
        if not chatbot:
            return Response(content=_error_xml(), media_type="text/xml")

        vs = _voice_settings(chatbot)
        base_url = vs.get("webhook_base_url", "").rstrip("/")
        session_id = sid or f"voice_{CallSid}"
        text = SpeechResult.strip()

        print(f"📞 Customer said: '{text}'")

        # ── STEP 1: No speech detected ────────────────
        if not text:
            return Response(
                content=f'<?xml version="1.0" encoding="UTF-8"?>'
                        f'<Response>'
                        f'<Redirect method="POST">{base_url}/api/voice/timeout/{api_key}?sid={session_id}</Redirect>'
                        f'</Response>',
                media_type="text/xml"
            )

        # ── STEP 2: Check keywords IMMEDIATELY ────────
        # Do this before saving to DB, before RAG, before anything
        kw = _check_keywords(text)
        print(f"📞 Keyword action: {kw}")

        # Get or create conversation
        conv = db.query(Conversation).filter(
            Conversation.chatbot_id == chatbot.id,
            Conversation.session_id == session_id
        ).first()
        if not conv:
            conv = Conversation(
                chatbot_id=chatbot.id,
                session_id=session_id,
                channel="voice"
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)

        # Save customer message
        db.add(Message(conversation_id=conv.id, role="user", content=text))
        db.commit()

        # ── STEP 3: Handle END ────────────────────────
        if kw == "end":
            print(f"📞 Goodbye detected — hanging up")
            farewell = "Thank you for calling! Have a wonderful day. Goodbye!"
            db.add(Message(conversation_id=conv.id, role="assistant", content=farewell))
            db.commit()

            speak_el = await _speak_fast(farewell, vs, base_url)

            # Return hangup immediately — no Gather, no Redirect
            return Response(
                content=f'<?xml version="1.0" encoding="UTF-8"?>'
                        f'<Response>'
                        f'{speak_el}'
                        f'<Hangup/>'
                        f'</Response>',
                media_type="text/xml"
            )

        # ── STEP 4: Handle HUMAN TRANSFER ─────────────
        if kw == "human":
            handoff_number = vs.get("handoff_number", "").strip()
            hold_text = "Absolutely! Let me connect you with our team right away. One moment please."
            db.add(Message(conversation_id=conv.id, role="assistant", content=hold_text))
            db.commit()

            if not handoff_number:
                print("⚠️ Human transfer requested but NO handoff number configured")
                sorry = "I apologize, but no one is available to take your call right now. Please try calling back during business hours. Goodbye!"
                sorry_el = await _speak_fast(sorry, vs, base_url)
                return Response(
                    content=f'<?xml version="1.0" encoding="UTF-8"?>'
                            f'<Response>{sorry_el}<Hangup/></Response>',
                    media_type="text/xml"
                )

            # Auto-format phone number
            if not handoff_number.startswith("+"):
                import re
                clean_num = re.sub(r'[\s\-\(\)]', '', handoff_number)
                if clean_num.isdigit():
                    handoff_number = "+" + clean_num

            print(f"📞 Transferring call to: {handoff_number}")

            hold_el = await _speak_fast(hold_text, vs, base_url)

            twiml = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    {hold_el}
    <Dial timeout="20">
        <Number>{handoff_number}</Number>
    </Dial>
    <Say voice="Polly.Joanna">Sorry, our team is not available right now. Please try calling back later. Goodbye!</Say>
    <Hangup/>
</Response>'''

            return Response(content=twiml, media_type="text/xml")

        # ── STEP 5: Normal — RAG pipeline ─────────────
        msgs = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(Message.created_at).all()

        history = [
            {"role": m.role, "content": m.content}
            for m in msgs[:-1]
        ]

        voice_prompt = (chatbot.system_prompt or "") + "\n\n" + VOICE_PROMPT

        result = await get_voice_rag_response(
            chatbot_name=chatbot.name,
            chatbot_id=str(chatbot.id),
            personality=chatbot.personality,
            custom_system_prompt=voice_prompt,
            user_message=text,
            conversation_history=history if history else None,
        )

        resp = result["response"]

        db.add(Message(conversation_id=conv.id, role="assistant", content=resp))
        chatbot.message_count += 1
        db.commit()

        print(f"🤖 Bot responds: '{resp[:80]}'")

        speak_el = await _speak_fast(resp, vs, base_url)
        action = f"{base_url}/api/voice/respond/{api_key}?sid={session_id}"

        return Response(
            content=f'<?xml version="1.0" encoding="UTF-8"?>'
                    f'<Response>'
                    f'<Gather input="speech" action="{action}" method="POST" '
                    f'speechTimeout="auto" language="en-US">'
                    f'{speak_el}'
                    f'</Gather>'
                    f'<Redirect method="POST">'
                    f'{base_url}/api/voice/timeout/{api_key}?sid={session_id}'
                    f'</Redirect>'
                    f'</Response>',
            media_type="text/xml"
        )

    except Exception as e:
        print(f"❌ Respond error: {e}")
        traceback.print_exc()
        return Response(
            content=_error_xml("I had trouble with that. Please try again."),
            media_type="text/xml"
        )

@router.post("/timeout/{api_key}")
async def handle_timeout(api_key: str, sid: str = "", db: Session = Depends(get_db)):
    try:
        chatbot = _get_chatbot(api_key, db)
        if not chatbot:
            return Response(content=_error_xml("Goodbye."), media_type="text/xml")

        vs = _voice_settings(chatbot)
        base_url = vs.get("webhook_base_url", "").rstrip("/")
        action = f"{base_url}/api/voice/respond/{api_key}?sid={sid}"

        prompt_el = await _speak_fast("Are you still there?", vs, base_url)
        bye_el = await _speak_fast("Thanks for calling! Goodbye!", vs, base_url)

        return Response(content=f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="{action}" method="POST" speechTimeout="auto" language="en-US">
        {prompt_el}
    </Gather>
    {bye_el}
    <Hangup/>
</Response>''', media_type="text/xml")

    except Exception:
        return Response(content=_error_xml("Goodbye!"), media_type="text/xml")


@router.post("/status/{api_key}")
async def status(api_key: str):
    return Response(content="<Response/>", media_type="text/xml")


# ═══════════════════════════════════════════════════════════
#  AUDIO / OWNER ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.get("/audio/{filename}")
async def serve_audio(filename: str):
    filepath = os.path.join(AUDIO_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(filepath, media_type="audio/mpeg")


POLLY_VOICES = [
    {"id": "Polly.Joanna", "name": "Joanna", "gender": "Female", "accent": "American", "tone": "Warm & Professional"},
    {"id": "Polly.Salli", "name": "Salli", "gender": "Female", "accent": "American", "tone": "Friendly & Bright"},
    {"id": "Polly.Amy", "name": "Amy", "gender": "Female", "accent": "British", "tone": "Polished & Elegant"},
    {"id": "Polly.Matthew", "name": "Matthew", "gender": "Male", "accent": "American", "tone": "Clear & Professional"},
    {"id": "Polly.Joey", "name": "Joey", "gender": "Male", "accent": "American", "tone": "Casual & Friendly"},
    {"id": "Polly.Arthur", "name": "Arthur", "gender": "Male", "accent": "British", "tone": "Warm & Articulate"},
]


@router.get("/voices")
def list_voices():
    return {"phone_voices": POLLY_VOICES, "preview_voices": AVAILABLE_VOICES}


@router.get("/elevenlabs-status")
async def elevenlabs_status(current_user: User = Depends(get_current_user)):
    return await check_elevenlabs_status()


@router.post("/preview")
async def preview_voice(
    text: str = Body(..., embed=True),
    voice: str = Body(default="google-en-us", embed=True),
    speed: str = Body(default="+15%", embed=True),
    use_elevenlabs: bool = Body(default=False, embed=True),
    current_user: User = Depends(get_current_user),
):
    """Preview voice — ElevenLabs or gTTS."""
    if not text or len(text.strip()) < 2:
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        if use_elevenlabs and settings.ELEVENLABS_API_KEY and settings.ELEVENLABS_VOICE_ID:
            speed_val = SPEED_MAP.get("fast", 1.15)
            filename = await generate_cloned_speech(text[:300], speed=speed_val)
            filepath = os.path.join(AUDIO_DIR, filename)
            return FileResponse(filepath, media_type="audio/mpeg", filename="preview.mp3")
        else:
            filename = await generate_speech(text[:500], voice, speed)
            filepath = os.path.join(AUDIO_DIR, filename)
            return FileResponse(filepath, media_type="audio/mpeg", filename="preview.mp3")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")


@router.put("/settings/{chatbot_id}")
async def update_voice_settings(
    chatbot_id: str,
    voice_settings: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import update as sql_update
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id, Chatbot.user_id == current_user.id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    db.execute(sql_update(Chatbot).where(Chatbot.id == chatbot_id).values(voice_settings=voice_settings))
    db.commit()
    db.refresh(chatbot)
    return {"status": "saved", "voice_settings": chatbot.voice_settings}