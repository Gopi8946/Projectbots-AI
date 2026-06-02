"""
FREE TOOLS API ROUTER
Powers the free marketing tools on the website.
Uses Groq directly for fast, free generation.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import httpx
from app.core.config import settings

router = APIRouter(prefix="/api/tools", tags=["Free Tools"])


class FAQRequest(BaseModel):
    mode: str  # "text" or "url"
    content: str


class BotNameRequest(BaseModel):
    industry: str
    tone: str
    brand_name: Optional[str] = None


async def _call_groq(prompt: str, max_tokens: int = 800) -> str:
    """Call Groq API directly for tool generation."""
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": max_tokens,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="AI generation failed")
        return response.json()["choices"][0]["message"]["content"]


@router.post("/faq-generator")
async def generate_faq(data: FAQRequest):
    """Generate FAQ from business content."""
    if len(data.content.strip()) < 20:
        raise HTTPException(status_code=400, detail="Content too short")

    prompt = f"""Based on this business information, generate exactly 8 FAQ questions and answers.

Business info: {data.content[:2000]}

Return ONLY a JSON array like this — no other text:
[
  {{"q": "Question here?", "a": "Answer here."}},
  {{"q": "Question here?", "a": "Answer here."}}
]

Make the questions realistic — things customers actually ask.
Keep answers concise (1-2 sentences each)."""

    try:
        result = await _call_groq(prompt, max_tokens=1000)
        import json
        import re
        # Extract JSON from response
        json_match = re.search(r'\[.*\]', result, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON found")
        faqs = json.loads(json_match.group())
        return {"faqs": faqs[:8]}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate FAQs. Please try again.")


@router.post("/bot-name-generator")
async def generate_bot_names(data: BotNameRequest):
    """Generate creative chatbot names."""
    brand_part = f" for '{data.brand_name}'" if data.brand_name else ""

    prompt = f"""Generate 10 creative AI chatbot names for a {data.industry} business{brand_part}.
Tone should be: {data.tone}

Rules:
- Names should be 1-3 words
- Combine business relevance with AI/bot theme
- Make them memorable and professional
- Mix different styles (some with "AI", some without, some creative)

Return ONLY a JSON array of strings — no other text:
["Name One", "Name Two", "Name Three", ...]"""

    try:
        result = await _call_groq(prompt, max_tokens=300)
        import json
        import re
        json_match = re.search(r'\[.*?\]', result, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON found")
        names = json.loads(json_match.group())
        return {"names": names[:10]}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate names. Please try again.")