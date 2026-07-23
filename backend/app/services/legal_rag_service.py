"""Legal RAG ingestion and search services."""

import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from app.services.legal_document_extraction_service import (
    LegalDocumentExtractionService,
    legal_document_extraction_service,
)

RAG_FILE_SUFFIXES = {".pdf", ".docx", ".txt", ".md"}


@dataclass(frozen=True)
class LegalRAGChunk:
    chunk_id: str
    content: str
    metadata: dict[str, str]


class LegalRAGIngestionService:
    """Ingest source documents from `data/legal_rag/raw` into processed chunks."""

    def __init__(
        self,
        extraction_service: LegalDocumentExtractionService | None = None,
    ) -> None:
        self.extraction_service = extraction_service or legal_document_extraction_service

    async def ingest(
        self,
        source_root: Path,
        processed_root: Path,
        category: str | None = None,
        force: bool = False,
    ) -> tuple[int, int, list[str]]:
        files_processed = 0
        chunks_created = 0
        skipped_files: list[str] = []

        for source_file in self._iter_source_files(source_root, category):
            metadata = self._metadata_for(source_root, source_file)
            output_stem = self._safe_stem(source_file)
            text_path = processed_root / "extracted_text" / f"{output_stem}.txt"
            chunks_path = processed_root / "chunks" / f"{output_stem}.jsonl"
            metadata_path = processed_root / "metadata" / f"{output_stem}.json"

            if chunks_path.exists() and not force:
                skipped_files.append(str(source_file))
                continue

            try:
                text = await self.extraction_service.extract_text(
                    source_file,
                    self._mime_type(source_file),
                )
            except Exception as exc:
                skipped_files.append(f"{source_file}: {exc}")
                continue

            chunks = self._chunk_text(text, metadata)
            self._write_text(text_path, text)
            self._write_chunks(chunks_path, chunks)
            self._write_json(metadata_path, metadata)
            files_processed += 1
            chunks_created += len(chunks)

        return files_processed, chunks_created, skipped_files

    def _iter_source_files(self, source_root: Path, category: str | None) -> list[Path]:
        root = source_root / category if category else source_root
        if not root.exists():
            return []
        return sorted(path for path in root.rglob("*") if path.suffix.lower() in RAG_FILE_SUFFIXES)

    def _metadata_for(self, source_root: Path, source_file: Path) -> dict[str, str]:
        relative = source_file.relative_to(source_root)
        source = relative.parts[0] if len(relative.parts) > 1 else "unknown"
        return {
            "source": source,
            "category": source,
            "document_type": self._infer_document_type(source_file),
            "law_reference": "",
            "jurisdiction": "FR",
            "last_update": "",
            "source_path": str(source_file),
        }

    def _chunk_text(self, text: str, metadata: dict[str, str]) -> list[LegalRAGChunk]:
        normalized = re.sub(r"\s+", " ", text).strip()
        if not normalized:
            return []

        words = normalized.split()
        chunk_size = 450
        overlap = 80
        chunks: list[LegalRAGChunk] = []
        step = chunk_size - overlap

        for index, start in enumerate(range(0, len(words), step)):
            chunk_words = words[start : start + chunk_size]
            if not chunk_words:
                continue
            content = " ".join(chunk_words)
            chunk_metadata = metadata | {"chunk_index": str(index)}
            chunk_id = str(uuid5(NAMESPACE_URL, f"{metadata['source_path']}#{index}"))
            chunks.append(
                LegalRAGChunk(chunk_id=chunk_id, content=content, metadata=chunk_metadata)
            )
        return chunks

    def _infer_document_type(self, source_file: Path) -> str:
        name = source_file.stem.lower()
        if "bail" in name:
            return "bail"
        if "dpe" in name or "diagnostic" in name:
            return "diagnostic"
        if "compromis" in name:
            return "compromis_de_vente"
        if "mandat" in name:
            return "mandat"
        return "legal_reference"

    def _safe_stem(self, source_file: Path) -> str:
        return re.sub(r"[^a-zA-Z0-9_.-]+", "_", source_file.with_suffix("").as_posix())

    def _mime_type(self, source_file: Path) -> str:
        return {
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".md": "text/markdown",
        }.get(source_file.suffix.lower(), "application/octet-stream")

    def _write_text(self, path: Path, content: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def _write_chunks(self, path: Path, chunks: list[LegalRAGChunk]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        lines = [
            json.dumps(
                {"chunk_id": chunk.chunk_id, "content": chunk.content, "metadata": chunk.metadata},
                ensure_ascii=False,
            )
            for chunk in chunks
        ]
        path.write_text("\n".join(lines), encoding="utf-8")

    def _write_json(self, path: Path, payload: dict[str, str]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


class LegalRAGSearchService:
    """Search processed legal chunks.

    This is a local lexical scorer. It gives the RAG agent real source-backed
    retrieval now and can be replaced by Qdrant/pgvector without changing the
    router or agent contract.
    """

    def __init__(self, processed_root: Path | None = None) -> None:
        self.processed_root = processed_root or Path("data/legal_rag/processed")

    async def search(
        self,
        query: str,
        category: str | None = None,
        document_type: str | None = None,
        jurisdiction: str = "FR",
        limit: int = 5,
    ) -> list[dict[str, object]]:
        query_terms = self._terms(query)
        if not query_terms:
            return []

        scored: list[tuple[float, LegalRAGChunk]] = []
        for chunk in self._load_chunks():
            metadata = chunk.metadata
            if category and metadata.get("category") != category:
                continue
            if document_type and metadata.get("document_type") != document_type:
                continue
            if jurisdiction and metadata.get("jurisdiction") != jurisdiction:
                continue

            score = self._score(query_terms, chunk.content)
            if score > 0:
                scored.append((score, chunk))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [
            {
                "chunk_id": chunk.chunk_id,
                "content": chunk.content,
                "score": score,
                "metadata": chunk.metadata,
            }
            for score, chunk in scored[:limit]
        ]

    def _load_chunks(self) -> list[LegalRAGChunk]:
        chunks_dir = self.processed_root / "chunks"
        if not chunks_dir.exists():
            return []

        chunks: list[LegalRAGChunk] = []
        for path in sorted(chunks_dir.glob("*.jsonl")):
            for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
                if not line.strip():
                    continue
                payload = json.loads(line)
                chunks.append(
                    LegalRAGChunk(
                        chunk_id=str(payload["chunk_id"]),
                        content=str(payload["content"]),
                        metadata={key: str(value) for key, value in payload["metadata"].items()},
                    )
                )
        return chunks

    def _score(self, query_terms: set[str], content: str) -> float:
        content_terms = self._terms(content)
        if not content_terms:
            return 0.0
        intersection = query_terms & content_terms
        return len(intersection) / math.sqrt(len(content_terms))

    def _terms(self, text: str) -> set[str]:
        return {
            token
            for token in re.findall(r"[a-zA-ZÀ-ÿ0-9]{3,}", text.lower())
            if token not in {"les", "des", "une", "avec", "pour", "dans", "sur"}
        }


legal_rag_ingestion_service = LegalRAGIngestionService()
legal_rag_search_service = LegalRAGSearchService()

