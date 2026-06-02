"""
DEEPGRAM AURA TTS — Ultra-fast neural text-to-speech.
~200ms generation time. Sounds natural. Free 200 min/month.
"""

import os
import uuid
import httpx
from app.core.config import settings

AUDIO_DIR = os.path.join(settings.UPLOAD_DIR, "voice_audio")

# Deepgram Aura voices
DEEPGRAM_VOICES = {
    "asteria": "Female, American, Warm",
    "luna": "Female, American, Soft",
    "stella": "Female, American, Bright",
    "athena": "Female, British, Sophisticated",
    "hera": "Female, American, Confident",
    "orion": "Male, American, Deep",
    "arcas": "Male, American, Steady",
    "perseus": "Male, American, Casual",
    "angus": "Male, Irish, Natural",
    "orpheus": "Male, American, Professional",
    "helios": "Male, British, Warm",
    "zeus": "Male, American, Bold",
}


def ensure_audio_dir():
    os.makedirs(AUDIO_DIR, exist_ok=True)


async def generate_deepgram_speech(
    text: str,
    voice: str = "aura-asteria-en",
) -> str:
    """
    Generate speech using Deepgram Aura.
    ~200ms response time — extremely fast.
    Returns filename of saved audio.
    """
    ensure_audio_dir()

    if not settings.DEEPGRAM_API_KEY:
        raise Exception("DEEPGRAM_API_KEY not configured in .env")

    filename = f"{uuid.uuid4().hex}.mp3"
    output_path = os.path.join(AUDIO_DIR, filename)

    url = f"https://api.deepgram.com/v1/speak?model={voice}&encoding=mp3"

    headers = {
        "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {"text": text}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(url, headers=headers, json=payload)

            if response.status_code == 401:
                raise Exception("Invalid Deepgram API key")
            if response.status_code != 200:
                raise Exception(f"Deepgram error {response.status_code}: {response.text[:200]}")

            with open(output_path, "wb") as f:
                f.write(response.content)

        if os.path.getsize(output_path) < 100:
            raise Exception("Generated audio is empty")

        return filename

    except httpx.TimeoutException:
        raise Exception("Deepgram request timed out")
    except httpx.ConnectError:
        raise Exception("Cannot connect to Deepgram API")