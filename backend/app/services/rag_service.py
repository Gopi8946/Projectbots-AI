"""
RAG SERVICE — Retrieval-Augmented Generation
This is the HEART of ProjectBots.AI.

It orchestrates the entire flow:
1. Customer asks a question
2. Convert question to embedding
3. Search vector database for relevant chunks
4. Build a prompt with the retrieved context
5. Send to LLM
6. Return the answer with source attribution

The key insight: The AI model NEVER answers from its own training data.
It ONLY answers based on the chunks we retrieve from the owner's uploaded data.
This prevents hallucination and keeps answers specific to the business.
"""

from typing import List, Optional
from app.services.embedding_service import generate_single_embedding
from app.services.vector_store import search_similar
from app.services.llm_service import generate_response


def build_system_prompt(
    chatbot_name: str,
    personality: str,
    custom_system_prompt: Optional[str],
    context_chunks: List[dict]
) -> str:
    """
    Build the complete system prompt that controls the AI's behavior.

    This prompt has 3 parts:
    1. Identity — who the bot is
    2. Rules — what it can and cannot do
    3. Context — the retrieved knowledge base chunks
    """
    # Personality descriptions
    personality_map = {
        "professional": "professional, helpful, and courteous",
        "friendly": "warm, friendly, and conversational — use casual language and emojis occasionally",
        "formal": "formal, precise, and corporate — use proper business language",
        "enthusiastic": "enthusiastic, energetic, and excited — show passion and positivity",
        "concise": "concise and direct — give short, clear answers without unnecessary filler",
    }
    personality_desc = personality_map.get(personality, "professional and helpful")

    # Build the context section from retrieved chunks
    if context_chunks:
        context_text = "\n\n".join(
            f"[Source: {chunk['source_name']}]\n{chunk['content']}"
            for chunk in context_chunks
        )
    else:
        context_text = "No relevant information found in the knowledge base."

    # Assemble the system prompt
    prompt = f"""You are {chatbot_name}, an AI assistant. Your communication style is {personality_desc}.

{f"Additional instructions from the owner: {custom_system_prompt}" if custom_system_prompt else ""}

CRITICAL RULES — YOU MUST FOLLOW THESE:
1. ONLY answer based on the "KNOWLEDGE BASE CONTEXT" provided below.
2. If the answer is NOT in the context, say: "I don't have that specific information. Would you like me to connect you with our team?"
3. NEVER make up facts, prices, hours, policies, or any information not in the context.
4. Be {personality_desc}.
5. If asked about topics completely unrelated to the business, politely redirect: "I'm here to help with questions about {chatbot_name}. How can I assist you with that?"
6. Keep responses concise but complete. Use bullet points for lists.
7. If the user greets you, greet them back warmly and ask how you can help.

KNOWLEDGE BASE CONTEXT:
{context_text}

Remember: ONLY use the information above. If it's not there, say you don't know."""

    return prompt


async def get_rag_response(
    chatbot_name: str,
    chatbot_id: str,
    personality: str,
    custom_system_prompt: Optional[str],
    user_message: str,
    conversation_history: Optional[List[dict]] = None
) -> dict:
    """
    The main RAG pipeline. This is where all the magic happens.

    Flow:
    User question → Embed → Search → Retrieve → Prompt → LLM → Response
    """

    # STEP 1: Convert the user's question into an embedding vector
    query_embedding = generate_single_embedding(user_message)

    # STEP 2: Search the vector database for relevant chunks
    relevant_chunks = search_similar(
        chatbot_id=str(chatbot_id),
        query_embedding=query_embedding,
        n_results=5
    )

    # STEP 3: Build the system prompt with retrieved context
    system_prompt = build_system_prompt(
        chatbot_name=chatbot_name,
        personality=personality,
        custom_system_prompt=custom_system_prompt,
        context_chunks=relevant_chunks
    )

    # STEP 4: Send to LLM and get response
    response_text = await generate_response(
        system_prompt=system_prompt,
        user_message=user_message,
        conversation_history=conversation_history
    )

    # STEP 5: Return response with sources
    sources = [
        {
            "content": chunk["content"][:200] + "..." if len(chunk["content"]) > 200 else chunk["content"],
            "source_name": chunk["source_name"],
            "relevance_score": chunk["relevance_score"]
        }
        for chunk in relevant_chunks
    ]

    return {
        "response": response_text,
        "sources": sources
    }

async def get_voice_rag_response(
    chatbot_name: str,
    chatbot_id: str,
    personality: str,
    custom_system_prompt: Optional[str],
    user_message: str,
    conversation_history: Optional[List[dict]] = None
) -> dict:
    """
    Ultra-fast RAG for voice calls.
    3 chunks, 80 tokens max, optimized prompt.
    """
    from app.services.llm_service import generate_voice_response

    # Embed and search (fast — ~0.1s)
    query_embedding = generate_single_embedding(user_message)
    relevant_chunks = search_similar(
        chatbot_id=str(chatbot_id),
        query_embedding=query_embedding,
        n_results=3
    )

    # Build minimal prompt for speed
    if relevant_chunks:
        context = "\n".join(
            f"{chunk['content'][:300]}"
            for chunk in relevant_chunks
        )
    else:
        context = "No specific information found."

    # Compact system prompt — shorter prompt = faster LLM
    system_prompt = f"""You are {chatbot_name}. Answer ONLY from the context below.
Phone call rules: 1-2 sentences max. Natural speech only. No formatting.
Spell prices as words. End with a question.

Context: {context}

{custom_system_prompt or ""}"""

    response_text = await generate_voice_response(
        system_prompt=system_prompt,
        user_message=user_message,
        conversation_history=conversation_history
    )

    return {
        "response": response_text,
        "sources": [{"content": c["content"][:100], "source_name": c["source_name"], "relevance_score": c["relevance_score"]} for c in relevant_chunks]
    }