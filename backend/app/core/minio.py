"""Lazy MinIO client singleton and bucket names.

Backs object storage: `property_media.storage_key` points here, never a row
(docs §5). MinIO's SDK is synchronous; no close needed.
"""

from typing import TYPE_CHECKING

from app.core.config import get_settings

if TYPE_CHECKING:
    from minio import Minio

# Buckets defined in docs §5.
BUCKET_PROPERTY_PHOTOS = "property-photos"
BUCKET_PROPERTY_VIDEOS = "property-videos"
BUCKET_FLOOR_PLANS = "floor-plans"
BUCKET_AVATARS = "avatars"
BUCKET_TOOL_ASSETS = "tool-assets"
BUCKET_LEGAL_DOCUMENTS = "legal-documents"

_minio: "Minio | None" = None


ALL_BUCKETS = (
    BUCKET_PROPERTY_PHOTOS,
    BUCKET_PROPERTY_VIDEOS,
    BUCKET_FLOOR_PLANS,
    BUCKET_AVATARS,
    BUCKET_TOOL_ASSETS,
    BUCKET_LEGAL_DOCUMENTS,
)


def get_minio() -> "Minio":
    global _minio
    if _minio is None:
        from minio import Minio

        settings = get_settings()
        _minio = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_root_user,
            secret_key=settings.minio_root_password,
            secure=settings.minio_secure,
        )
    return _minio


def ensure_buckets() -> None:
    """Create every docs §5 bucket if absent. Idempotent; safe to call on startup."""
    client = get_minio()
    for bucket in ALL_BUCKETS:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
