"""
LLM SERVICE
Supports two providers:
  1. GROQ  — Fast cloud API, free tier (called directly via httpx)
  2. OLLAMA — Local model, slow on CPU

No external SDK needed. Just plain HTTP calls.
"""

from typing import List, Optional
import httpx
from app.core.config import settings


# ─── GROQ PROVIDER (direct API call, no SDK) ────────────

async def _generate_groq(
    system_prompt: str,
    user_message: str,
    conversation_history: Optional[List[dict]] = None
) -> str:
    """Generate response using Groq API directly via httpx."""

    messages = [{"role": "system", "content": system_prompt}]

    if conversation_history:
        recent = conversation_history[-10:]
        messages.extend(recent)

    messages.append({"role": "user", "content": user_message})

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 512,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
            )

            if response.status_code == 401:
                return (
                    "⚠️ Invalid Groq API key. Please check GROQ_API_KEY in your .env file. "
                    "Get a free key at https://console.groq.com"
                )

            if response.status_code == 429:
                return (
                    "⚠️ Rate limit reached. Please wait a moment and try again."
                )

            if response.status_code != 200:
                error_detail = response.text
                return f"⚠️ Groq API error ({response.status_code}): {error_detail[:200]}"

            data = response.json()
            return data["choices"][0]["message"]["content"]

    except httpx.ConnectError:
        return (
            "⚠️ Cannot connect to Groq API. Please check your internet connection."
        )
    except httpx.TimeoutException:
        return (
            "⚠️ Request timed out. Please try again."
        )
    except Exception as e:
        return f"⚠️ Error: {str(e)}"


# ─── OLLAMA PROVIDER ────────────────────────────────────

async def _generate_ollama(
    system_prompt: str,
    user_message: str,
    conversation_history: Optional[List[dict]] = None
) -> str:
    """Generate response using local Ollama."""

    messages = [{"role": "system", "content": system_prompt}]

    if conversation_history:
        recent = conversation_history[-10:]
        messages.extend(recent)

    messages.append({"role": "user", "content": user_message})

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 512,
                    }
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]

    except httpx.ConnectError:
        return "⚠️ Cannot connect to Ollama. Run 'ollama serve' in a terminal."
    except Exception as e:
        return f"⚠️ Ollama error: {str(e)}"


# ─── MAIN FUNCTION ───────────────────────────────────────

async def generate_response(
    system_prompt: str,
    user_message: str,
    conversation_history: Optional[List[dict]] = None
) -> str:
    """Generate AI response using the configured provider."""

    if settings.LLM_PROVIDER == "groq":
        return await _generate_groq(system_prompt, user_message, conversation_history)
    else:
        return await _generate_ollama(system_prompt, user_message, conversation_history)


async def check_ollama_health() -> dict:
    """Check the health of the configured LLM provider."""

    if settings.LLM_PROVIDER == "groq":
        has_key = bool(
            settings.GROQ_API_KEY
            and len(settings.GROQ_API_KEY) > 10
            and settings.GROQ_API_KEY != "gsk_paste_your_actual_key_here"
        )

        if not has_key:
            return {
                "provider": "groq",
                "status": "missing_api_key",
                "model": settings.GROQ_MODEL,
                "note": "Set GROQ_API_KEY in .env — get free key at https://console.groq.com"
            }

        # Test the API with a tiny request
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [{"role": "user", "content": "hi"}],
                        "max_tokens": 5,
                    },
                )

                if response.status_code == 200:
                    return {
                        "provider": "groq",
                        "status": "ready",
                        "model": settings.GROQ_MODEL,
                        "note": "Connected and working"
                    }
                else:
                    return {
                        "provider": "groq",
                        "status": "error",
                        "model": settings.GROQ_MODEL,
                        "note": f"API returned status {response.status_code}"
                    }
        except Exception as e:
            return {
                "provider": "groq",
                "status": "error",
                "model": settings.GROQ_MODEL,
                "note": str(e)
            }
    else:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                response.raise_for_status()
                data = response.json()
                models = [m["name"] for m in data.get("models", [])]
                return {
                    "provider": "ollama",
                    "status": "running",
                    "model": settings.OLLAMA_MODEL,
                    "available_models": models
                }
        except Exception:
            return {
                "provider": "ollama",
                "status": "not_running",
                "model": settings.OLLAMA_MODEL,
                "note": "Start Ollama with: ollama serve"
            }
        
async def generate_voice_response(
    system_prompt: str,
    user_message: str,
    conversation_history: Optional[List[dict]] = None
) -> str:
    """
    Ultra-fast LLM response for voice calls.
    Uses fewer tokens (100 vs 512) for faster generation.
    Voice responses should be 1-2 sentences only.
    """
    if settings.LLM_PROVIDER == "groq":
        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            recent = conversation_history[-6:]  # Less history for speed
            messages.extend(recent)

        messages.append({"role": "user", "content": user_message})

        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": settings.GROQ_MODEL,
            "messages": messages,
            "temperature": 0.5,
            "max_tokens": 80,
            "model": "llama-3.1-8b-instant", # Much shorter for voice — 1-2 sentences
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                )

                if response.status_code != 200:
                    return "I'm sorry, I couldn't process that. Could you try asking again?"

                data = response.json()
                return data["choices"][0]["message"]["content"]

        except Exception:
            return "I'm having a bit of trouble right now. Could you repeat that?"
    else:
        return await generate_response(system_prompt, user_message, conversation_history)