"""
ELEVENLABS TTS SERVICE — Streaming for minimum latency.
Uses eleven_turbo_v2_5 model with streaming response.
Target: ~0.5s audio generation.
"""

import os
import uuid
import httpx
from app.core.config import settings

AUDIO_DIR = os.path.join(settings.UPLOAD_DIR, "voice_audio")
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"
MODEL_ID = "eleven_turbo_v2_5"


def ensure_audio_dir():
    os.makedirs(AUDIO_DIR, exist_ok=True)


async def generate_cloned_speech(
    text: str,
    voice_id: str = None,
    stability: float = 0.4,
    similarity: float = 0.80,
    speed: float = 1.15,
) -> str:
    """
    Generate speech using ElevenLabs with streaming.
    Streams audio chunks as they arrive instead of waiting for full file.
    Returns filename of saved audio.
    """
    ensure_audio_dir()

    vid = voice_id or settings.ELEVENLABS_VOICE_ID
    if not vid:
        raise Exception("No ElevenLabs voice ID configured")

    api_key = settings.ELEVENLABS_API_KEY
    if not api_key:
        raise Exception("No ElevenLabs API key configured")

    filename = f"{uuid.uuid4().hex}.mp3"
    output_path = os.path.join(AUDIO_DIR, filename)

    # Use streaming endpoint for lower latency
    url = f"{ELEVENLABS_API_URL}/{vid}/stream"

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    payload = {
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity,
            "style": 0.3,
            "use_speaker_boost": True,
            "speed": speed,
        },
        "optimize_streaming_latency": 4,  # Maximum latency optimization (0-4)
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code == 401:
                    raise Exception("Invalid ElevenLabs API key")
                if response.status_code == 422:
                    raise Exception("ElevenLabs rejected the request — check voice ID")
                if response.status_code != 200:
                    raise Exception(f"ElevenLabs error {response.status_code}")

                # Stream audio chunks to file as they arrive
                with open(output_path, "wb") as f:
                    async for chunk in response.aiter_bytes(chunk_size=4096):
                        if chunk:
                            f.write(chunk)

        if not os.path.exists(output_path) or os.path.getsize(output_path) < 100:
            raise Exception("Generated audio file is empty")

        return filename

    except httpx.TimeoutException:
        raise Exception("ElevenLabs request timed out")
    except httpx.ConnectError:
        raise Exception("Cannot connect to ElevenLabs API")


async def check_elevenlabs_status() -> dict:
    if not settings.ELEVENLABS_API_KEY:
        return {"status": "not_configured", "message": "Set ELEVENLABS_API_KEY in .env"}
    if not settings.ELEVENLABS_VOICE_ID:
        return {"status": "no_voice", "message": "Set ELEVENLABS_VOICE_ID in .env"}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://api.elevenlabs.io/v1/voices",
                headers={"xi-api-key": settings.ELEVENLABS_API_KEY}
            )
            if response.status_code == 200:
                voices = response.json().get("voices", [])
                found = any(v["voice_id"] == settings.ELEVENLABS_VOICE_ID for v in voices)
                return {
                    "status": "ready" if found else "voice_not_found",
                    "voice_count": len(voices),
                    "target_voice_found": found,
                }
            return {"status": "auth_failed", "message": "Invalid API key"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# Pre-generated audio cache
_audio_cache: dict = {}


async def warm_up_common_phrases(voice_id: str = None):
    """
    Pre-generate audio for common phrases at server startup.
    These play instantly during calls — no generation delay.
    """
    common_phrases = [
        "Thank you for calling! Have a wonderful day. Goodbye!",
        "Are you still there? Is there anything else I can help with?",
        "Absolutely! Let me connect you with our team right away.",
        "Thanks for calling! Goodbye!",
    ]

    vid = voice_id or settings.ELEVENLABS_VOICE_ID
    if not vid or not settings.ELEVENLABS_API_KEY:
        print("⚠️ Skipping voice warmup — ElevenLabs not configured")
        return

    print("🎤 Pre-generating common phrase audio...")
    for phrase in common_phrases:
        try:
            filename = await generate_cloned_speech(phrase, voice_id=vid)
            _audio_cache[phrase] = filename
            print(f"  ✅ Cached: '{phrase[:40]}...'")
        except Exception as e:
            print(f"  ⚠️ Failed to cache: {e}")
    print(f"✅ Voice warmup complete — {len(_audio_cache)} phrases cached")


def get_cached_audio(text: str):
    """Return cached audio filename if available."""
    return _audio_cache.get(text)