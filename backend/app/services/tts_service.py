"""
TTS SERVICE — Natural, Fast Text-to-Speech
Edge TTS (neural voices) with gTTS fallback.
Audio post-processing to control speed for ALL engines.
"""

import os
import uuid
from app.core.config import settings

AUDIO_DIR = os.path.join(settings.UPLOAD_DIR, "voice_audio")

AVAILABLE_VOICES = [
    {"id": "en-US-JennyNeural", "name": "Jenny", "gender": "Female", "accent": "American", "tone": "Warm & Professional", "engine": "edge"},
    {"id": "en-US-AriaNeural", "name": "Aria", "gender": "Female", "accent": "American", "tone": "Expressive & Friendly", "engine": "edge"},
    {"id": "en-US-SaraNeural", "name": "Sara", "gender": "Female", "accent": "American", "tone": "Cheerful & Bright", "engine": "edge"},
    {"id": "en-US-GuyNeural", "name": "Guy", "gender": "Male", "accent": "American", "tone": "Professional & Clear", "engine": "edge"},
    {"id": "en-US-DavisNeural", "name": "Davis", "gender": "Male", "accent": "American", "tone": "Casual & Relaxed", "engine": "edge"},
    {"id": "en-US-JasonNeural", "name": "Jason", "gender": "Male", "accent": "American", "tone": "Friendly & Confident", "engine": "edge"},
    {"id": "en-US-TonyNeural", "name": "Tony", "gender": "Male", "accent": "American", "tone": "Energetic & Bold", "engine": "edge"},
    {"id": "en-GB-SoniaNeural", "name": "Sonia", "gender": "Female", "accent": "British", "tone": "Elegant & Polished", "engine": "edge"},
    {"id": "en-GB-RyanNeural", "name": "Ryan", "gender": "Male", "accent": "British", "tone": "Warm & Articulate", "engine": "edge"},
    {"id": "en-AU-NatashaNeural", "name": "Natasha", "gender": "Female", "accent": "Australian", "tone": "Friendly & Natural", "engine": "edge"},
    {"id": "en-IN-NeerjaNeural", "name": "Neerja", "gender": "Female", "accent": "Indian", "tone": "Clear & Professional", "engine": "edge"},
    {"id": "en-IN-PrabhatNeural", "name": "Prabhat", "gender": "Male", "accent": "Indian", "tone": "Professional & Steady", "engine": "edge"},
    {"id": "google-en-us", "name": "Google US", "gender": "Female", "accent": "American", "tone": "Clear & Reliable", "engine": "gtts"},
    {"id": "google-en-gb", "name": "Google UK", "gender": "Female", "accent": "British", "tone": "Clear & Reliable", "engine": "gtts"},
    {"id": "google-en-au", "name": "Google AU", "gender": "Female", "accent": "Australian", "tone": "Clear & Reliable", "engine": "gtts"},
    {"id": "google-en-in", "name": "Google IN", "gender": "Female", "accent": "Indian", "tone": "Clear & Reliable", "engine": "gtts"},
]

GTTS_LANG_MAP = {
    "google-en-us": {"lang": "en", "tld": "com"},
    "google-en-gb": {"lang": "en", "tld": "co.uk"},
    "google-en-au": {"lang": "en", "tld": "com.au"},
    "google-en-in": {"lang": "en", "tld": "co.in"},
}

# Speed string to multiplier: "1.0" = normal, "1.3" = 30% faster
SPEED_MAP = {
    "-10%": 0.9,
    "+0%": 1.0,
    "+15%": 1.15,
    "+30%": 1.3,
    "+45%": 1.45,
    "+60%": 1.6,
}


def ensure_audio_dir():
    os.makedirs(AUDIO_DIR, exist_ok=True)


def _speed_up_audio(input_path: str, speed_multiplier: float) -> bool:
    """
    Speed up an audio file using pydub + ffmpeg.
    Modifies the file in place.
    Returns True on success.
    """
    if speed_multiplier == 1.0:
        return True

    try:
        try:
            from pydub import AudioSegment  # type: ignore
        except ImportError:
            print("⚠️ pydub not installed — speed control unavailable")
            return False

        audio = AudioSegment.from_mp3(input_path)

        # Change speed by altering frame rate then converting back
        # This changes speed WITHOUT changing pitch (sounds natural)
        new_frame_rate = int(audio.frame_rate * speed_multiplier)
        sped_up = audio._spawn(audio.raw_data, overrides={"frame_rate": new_frame_rate})
        sped_up = sped_up.set_frame_rate(audio.frame_rate)

        sped_up.export(input_path, format="mp3")
        return True
    except Exception as e:
        print(f"⚠️ Speed processing failed: {e}")
        return False


async def _try_edge_tts(text: str, voice: str, rate: str, output_path: str) -> bool:
    """Attempt Edge TTS. Returns True on success."""
    try:
        try:
            import edge_tts  # type: ignore
        except ImportError:
            return False
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(output_path)
        if os.path.exists(output_path) and os.path.getsize(output_path) > 100:
            return True
    except Exception as e:
        print(f"  Edge TTS failed for {voice}: {type(e).__name__}")
    if os.path.exists(output_path):
        try:
            os.remove(output_path)
        except OSError:
            pass
    return False


def _try_gtts(text: str, output_path: str, lang: str = "en", tld: str = "com") -> bool:
    """Attempt Google TTS. Returns True on success."""
    try:
        try:
            from gtts import gTTS  # type: ignore
        except ImportError:
            return False
        tts = gTTS(text=text, lang=lang, tld=tld, slow=False)
        tts.save(output_path)
        if os.path.exists(output_path) and os.path.getsize(output_path) > 100:
            return True
    except Exception as e:
        print(f"  gTTS failed: {type(e).__name__}: {e}")
    if os.path.exists(output_path):
        try:
            os.remove(output_path)
        except OSError:
            pass
    return False


async def generate_speech(text: str, voice: str = "google-en-us", speed: str = "+0%") -> str:
    """
    Generate speech audio with speed control.
    
    For Edge TTS: Speed is applied via the rate parameter (natural speed change).
    For gTTS: Speed is applied via post-processing with pydub (changes tempo).
    """
    ensure_audio_dir()
    filename = f"{uuid.uuid4().hex}.mp3"
    output_path = os.path.join(AUDIO_DIR, filename)

    speed_multiplier = SPEED_MAP.get(speed, 1.0)

    print(f"🎤 TTS: voice={voice}, speed={speed} (x{speed_multiplier})")

    # ── Google voice — use gTTS directly ──────────────
    if voice.startswith("google-"):
        gtts_config = GTTS_LANG_MAP.get(voice, {"lang": "en", "tld": "com"})
        success = _try_gtts(text, output_path, **gtts_config)
        if success:
            # Apply speed via post-processing
            if speed_multiplier != 1.0:
                _speed_up_audio(output_path, speed_multiplier)
            print(f"  ✅ gTTS success (speed x{speed_multiplier})")
            return filename
        raise Exception("Google TTS failed")

    # ── Edge TTS voice — try edge, fallback to gTTS ──
    # For Edge TTS, pass speed as rate parameter (handles it natively)
    edge_rate = speed if speed != "+0%" else "+0%"
    success = await _try_edge_tts(text, voice, edge_rate, output_path)
    if success:
        print(f"  ✅ Edge TTS success")
        return filename

    # Fallback to gTTS with post-processing speed
    print(f"  ⚠️ Edge TTS failed, trying gTTS fallback with speed x{speed_multiplier}...")
    success = _try_gtts(text, output_path)
    if success:
        if speed_multiplier != 1.0:
            _speed_up_audio(output_path, speed_multiplier)
        print(f"  ✅ gTTS fallback success (speed x{speed_multiplier})")
        return filename

    raise Exception("All TTS engines failed")


def cleanup_old_audio(max_age_minutes: int = 30):
    import time
    ensure_audio_dir()
    now = time.time()
    cutoff = now - (max_age_minutes * 60)
    for f in os.listdir(AUDIO_DIR):
        filepath = os.path.join(AUDIO_DIR, f)
        if os.path.isfile(filepath) and os.path.getmtime(filepath) < cutoff:
            try:
                os.remove(filepath)
            except OSError:
                pass


def get_voice_info(voice_id: str) -> dict:
    for v in AVAILABLE_VOICES:
        if v["id"] == voice_id:
            return v
    return AVAILABLE_VOICES[0]