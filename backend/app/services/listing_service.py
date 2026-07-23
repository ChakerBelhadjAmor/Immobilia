"""Seller listing business logic.

`run_intake` is pure extraction (human-in-the-loop — nothing persisted).
`create_listing` writes the human-confirmed data to `properties` (+`property_features`)
with a draft status. `attach_media` uploads bytes to MinIO and records the
`storage_key`, soft-warning when photos are fewer than declared bedrooms
(the "S+3 → 3 images" rule).
"""

import io
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.seller.listing_assistant import ListingAssistantAgent
from app.core.minio import (
    BUCKET_FLOOR_PLANS,
    BUCKET_PROPERTY_PHOTOS,
    BUCKET_PROPERTY_VIDEOS,
    get_minio,
)
from app.models.enums import MediaKind, PropertySource, PropertyStatus
from app.models.properties import Property, PropertyFeature, PropertyMedia
from app.schemas.listing import (
    ListingCreate,
    ListingIntakeRequest,
    ListingIntakeResponse,
)

_BUCKET_FOR_KIND: dict[MediaKind, str] = {
    MediaKind.photo: BUCKET_PROPERTY_PHOTOS,
    MediaKind.video: BUCKET_PROPERTY_VIDEOS,
    MediaKind.virtual_tour: BUCKET_PROPERTY_VIDEOS,
    MediaKind.floor_plan: BUCKET_FLOOR_PLANS,
}


async def run_intake(payload: ListingIntakeRequest) -> ListingIntakeResponse:
    agent = ListingAssistantAgent()
    result = await agent.run({"transcript": payload.transcript, "partial": payload.partial or {}})
    return ListingIntakeResponse(**result)


async def create_listing(db: AsyncSession, owner_id: UUID, payload: ListingCreate) -> Property:
    listing = Property(
        owner_id=owner_id,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        transaction=payload.transaction,
        status=PropertyStatus.brouillon,
        source=PropertySource.plateforme,
        price=payload.price,
        charges=payload.charges,
        surface=payload.surface,
        rooms=payload.rooms,
        bedrooms=payload.bedrooms,
        bathrooms=payload.bathrooms,
        floor=payload.floor,
        year_built=payload.year_built,
        energy_class=payload.energy_class,
        address=payload.address,
        city=payload.city,
        postal_code=payload.postal_code,
        neighborhood_id=payload.neighborhood_id,
    )
    db.add(listing)
    await db.flush()  # assign listing.id before feature FKs
    for feature in payload.features:
        db.add(PropertyFeature(property_id=listing.id, feature=feature))
    await db.commit()
    await db.refresh(listing)
    return listing


async def attach_media(
    db: AsyncSession,
    property_id: UUID,
    owner_id: UUID,
    kind: MediaKind,
    filename: str,
    data: bytes,
    content_type: str,
) -> tuple[PropertyMedia, str | None]:
    listing = await db.get(Property, property_id)
    if listing is None:
        raise LookupError(property_id)
    if listing.owner_id != owner_id:
        raise PermissionError(property_id)

    bucket = _BUCKET_FOR_KIND[kind]
    storage_key = f"{property_id}/{uuid4()}-{filename}"
    get_minio().put_object(
        bucket,
        storage_key,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type or "application/octet-stream",
    )

    position = await db.scalar(
        select(func.count())
        .select_from(PropertyMedia)
        .where(PropertyMedia.property_id == property_id, PropertyMedia.kind == kind)
    )
    media = PropertyMedia(
        property_id=property_id,
        kind=kind,
        storage_key=storage_key,
        position=position or 0,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)

    warning: str | None = None
    if kind == MediaKind.photo:
        photo_count = await db.scalar(
            select(func.count())
            .select_from(PropertyMedia)
            .where(
                PropertyMedia.property_id == property_id,
                PropertyMedia.kind == MediaKind.photo,
            )
        )
        if (photo_count or 0) < listing.bedrooms:
            warning = (
                f"Only {photo_count} photo(s) for {listing.bedrooms} bedroom(s) — "
                "sellers should supply at least one photo per bedroom."
            )
    return media, warning
