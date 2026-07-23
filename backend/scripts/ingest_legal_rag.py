"""Ingest legal RAG source files into processed chunks.

Usage:
    python scripts/ingest_legal_rag.py
    python scripts/ingest_legal_rag.py --category service_public --force
"""

import argparse
import asyncio
from pathlib import Path

from app.services.legal_rag_service import LegalRAGIngestionService


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", default="data/legal_rag/raw")
    parser.add_argument("--processed-root", default="data/legal_rag/processed")
    parser.add_argument("--category", default=None)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    service = LegalRAGIngestionService()
    files_processed, chunks_created, skipped_files = await service.ingest(
        source_root=Path(args.source_root),
        processed_root=Path(args.processed_root),
        category=args.category,
        force=args.force,
    )
    print(
        {
            "files_processed": files_processed,
            "chunks_created": chunks_created,
            "skipped_files": skipped_files,
        }
    )


if __name__ == "__main__":
    asyncio.run(main())

