"""Storage service for uploaded legal documents."""

from io import BytesIO
from pathlib import Path
from uuid import uuid4

from app.core.minio import BUCKET_LEGAL_DOCUMENTS, get_minio


class LegalStorageService:
    """Store legal documents under user-scoped object keys.

    MinIO is the production target. If MinIO is not reachable in local
    development, files are stored under `data/legal_uploads`.
    """

    def __init__(self, local_root: Path | None = None) -> None:
        self.local_root = local_root or Path("data/legal_uploads")

    async def store_content(
        self,
        user_id: str,
        filename: str,
        content: bytes,
        mime_type: str,
    ) -> tuple[str, str]:
        document_id = str(uuid4())
        filename = filename or f"{document_id}.bin"
        storage_key = f"users/{user_id}/legal_documents/{document_id}/{filename}"

        try:
            client = get_minio()
            if not client.bucket_exists(BUCKET_LEGAL_DOCUMENTS):
                client.make_bucket(BUCKET_LEGAL_DOCUMENTS)
            client.put_object(
                BUCKET_LEGAL_DOCUMENTS,
                storage_key,
                BytesIO(content),
                length=len(content),
                content_type=mime_type or "application/octet-stream",
            )
        except Exception:
            target = self.local_root / storage_key
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)

        return document_id, storage_key


legal_storage_service = LegalStorageService()
