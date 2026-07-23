"""Lazy Qdrant client singleton.

Backs the vector collections `property_embeddings`, `coloc_embeddings`,
`image_embeddings`, `legal_doc_chunks` (docs §3). Filtering happens in Qdrant,
not post-hoc in Python.
"""

from qdrant_client import AsyncQdrantClient

from app.core.config import get_settings

_qdrant: AsyncQdrantClient | None = None


def get_qdrant() -> AsyncQdrantClient:
    global _qdrant
    if _qdrant is None:
        _qdrant = AsyncQdrantClient(url=get_settings().qdrant_url)
    return _qdrant


async def close_qdrant() -> None:
    global _qdrant
    if _qdrant is not None:
        await _qdrant.close()
        _qdrant = None
