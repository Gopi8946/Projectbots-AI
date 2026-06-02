"""
EMBEDDING SERVICE
Converts text into numerical vectors (embeddings) that capture meaning.

"pizza" and "pasta" → similar vectors (both food)
"pizza" and "airplane" → very different vectors

This is how the system finds relevant chunks when a customer asks
a question — it compares the question's vector against all chunk vectors.
"""

from typing import List
from app.core.config import settings

# Module-level model cache — loaded once, reused forever
_model = None


def _load_model():
    """Load the sentence-transformers model (downloads on first run ~80MB)."""
    global _model
    if _model is None:
        print(f"⏳ Loading embedding model '{settings.EMBEDDING_MODEL}'...")
        print("   (First run downloads ~80MB from HuggingFace — be patient)")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print("✅ Embedding model loaded!")
    return _model


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Convert a list of text strings into embedding vectors.

    Input:  ["Our pizza is delicious", "We deliver within 5 miles"]
    Output: [[0.23, -0.45, 0.78, ...], [0.12, 0.67, -0.34, ...]]
            Each inner list has 384 numbers (dimensions).
    """
    model = _load_model()
    embeddings = model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()


def generate_single_embedding(text: str) -> List[float]:
    """Convert a single text string into an embedding vector."""
    model = _load_model()
    embedding = model.encode(text, show_progress_bar=False)
    return embedding.tolist()