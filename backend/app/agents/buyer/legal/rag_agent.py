"""French real-estate legal retrieval agent.

The production implementation should query pgvector with metadata filters.
This deterministic implementation gives the rest of the system a stable
contract while ingestion and embeddings are added.
"""

from typing import Any

from app.agents.base.orchestrator import Agent
from app.services.legal_rag_service import LegalRAGSearchService, legal_rag_search_service


class LegalRAGAgent(Agent):
    name = "legal_rag"

    def __init__(self, search_service: LegalRAGSearchService | None = None) -> None:
        self.search_service = search_service or legal_rag_search_service

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        query = str(context.get("message", ""))
        document_type = context.get("document_type")
        category = context.get("category", "general")
        search_results = await self.search_service.search(
            query=query,
            category=None if category == "general" else str(category),
            document_type=str(document_type) if document_type else None,
            jurisdiction="FR",
            limit=5,
        )

        return {
            "answer_context": (
                "Use retrieved French real-estate sources before final legal wording. "
                "If no chunk is returned, ask for ingestion or rely only on general guidance."
            ),
            "query": query,
            "metadata_filter": {
                "category": category,
                "document_type": document_type,
                "jurisdiction": "FR",
            },
            "chunks": search_results,
            "sources": self._sources(search_results),
        }

    def _sources(self, search_results: list[dict[str, object]]) -> list[dict[str, object]]:
        sources: list[dict[str, object]] = []
        seen: set[str] = set()
        for result in search_results:
            metadata = result.get("metadata", {})
            if not isinstance(metadata, dict):
                continue
            source_path = str(metadata.get("source_path", ""))
            if source_path in seen:
                continue
            seen.add(source_path)
            sources.append(
                {
                    "name": metadata.get("source", "unknown"),
                    "category": metadata.get("category", "unknown"),
                    "document_type": metadata.get("document_type", "unknown"),
                    "jurisdiction": metadata.get("jurisdiction", "FR"),
                    "source_path": source_path,
                    "score": result.get("score", 0),
                }
            )
        return sources
