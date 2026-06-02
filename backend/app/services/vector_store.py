"""
VECTOR STORE SERVICE
Manages ChromaDB — the database that stores and searches embeddings.

Each chatbot gets its own "collection" (like a separate table).
When a customer asks a question, we search ONLY that chatbot's collection.
"""

import uuid
from typing import List, Optional
import chromadb
from app.core.config import settings

# Module-level client — one connection reused
_client = None


def _get_client() -> chromadb.PersistentClient:
    """Get or create the ChromaDB client."""
    global _client
    if _client is None:
        print(f"⏳ Initializing ChromaDB at '{settings.CHROMA_DIR}'...")
        _client = chromadb.PersistentClient(path=settings.CHROMA_DIR)
        print("✅ ChromaDB ready!")
    return _client


def _collection_name(chatbot_id: str) -> str:
    """
    Generate a valid collection name for a chatbot.
    ChromaDB names must be 3-63 chars, alphanumeric/underscores/hyphens.
    """
    return f"bot_{str(chatbot_id).replace('-', '_')}"


def get_or_create_collection(chatbot_id: str):
    """Get an existing collection or create a new one for a chatbot."""
    client = _get_client()
    name = _collection_name(chatbot_id)
    return client.get_or_create_collection(
        name=name,
        metadata={"chatbot_id": str(chatbot_id)}
    )


def add_chunks(
    chatbot_id: str,
    chunks: List[str],
    embeddings: List[List[float]],
    source_id: str,
    source_name: str
):
    """
    Add text chunks and their embeddings to a chatbot's collection.

    Each chunk gets:
    - A unique ID
    - The text content (document)
    - The embedding vector
    - Metadata (which source file it came from)
    """
    collection = get_or_create_collection(chatbot_id)

    ids = [f"{source_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {"source_id": str(source_id), "source_name": source_name, "chunk_index": i}
        for i in range(len(chunks))
    ]

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return len(chunks)


def search_similar(
    chatbot_id: str,
    query_embedding: List[float],
    n_results: int = 5
) -> List[dict]:
    """
    Search for chunks most similar to the query.

    Returns the top N most relevant chunks with their text,
    source info, and relevance score (distance — lower is more similar).
    """
    collection = get_or_create_collection(chatbot_id)

    # Check if collection has any data
    if collection.count() == 0:
        return []

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(n_results, collection.count())
    )

    # Parse results into a clean format
    parsed = []
    if results and results["documents"] and results["documents"][0]:
        for i in range(len(results["documents"][0])):
            distance = results["distances"][0][i] if results["distances"] else 0
            # Convert distance to a 0-1 relevance score (1 = most relevant)
            relevance = max(0, 1 - distance)

            parsed.append({
                "content": results["documents"][0][i],
                "source_name": results["metadatas"][0][i].get("source_name", "Unknown"),
                "source_id": results["metadatas"][0][i].get("source_id", ""),
                "chunk_index": results["metadatas"][0][i].get("chunk_index", 0),
                "relevance_score": round(relevance, 3)
            })

    return parsed


def delete_source_chunks(chatbot_id: str, source_id: str):
    """Delete all chunks belonging to a specific data source."""
    collection = get_or_create_collection(chatbot_id)

    # Get all IDs that match this source
    try:
        results = collection.get(
            where={"source_id": str(source_id)}
        )
        if results and results["ids"]:
            collection.delete(ids=results["ids"])
            return len(results["ids"])
    except Exception:
        pass
    return 0


def delete_collection(chatbot_id: str):
    """Delete an entire chatbot's collection (when chatbot is deleted)."""
    client = _get_client()
    name = _collection_name(chatbot_id)
    try:
        client.delete_collection(name=name)
    except Exception:
        pass  # Collection might not exist yet


def get_collection_count(chatbot_id: str) -> int:
    """Get the total number of chunks in a chatbot's collection."""
    collection = get_or_create_collection(chatbot_id)
    return collection.count()