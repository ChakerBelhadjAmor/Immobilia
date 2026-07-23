"""Seller endpoints — all guarded by the `vendeur` role.

Flow: `POST /seller/listings/intake` runs Agent 1 (extraction + missing fields +
questions, nothing persisted); the human confirms and `POST /seller/listings`
writes the draft; `POST /seller/listings/{id}/media` uploads photos/videos.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_role
from app.models.enums import MediaKind, UserRole
from app.models.identity import User
from app.schemas.listing import (
    AttachMediaResponse,
    ListingCreate,
    ListingIntakeRequest,
    ListingIntakeResponse,
    MediaRead,
    PropertyRead,
)
from app.services import listing_service

router = APIRouter(prefix="/seller", tags=["seller"])

SellerDep = Annotated[User, Depends(require_role(UserRole.vendeur))]


@router.post("/listings/intake", response_model=ListingIntakeResponse)
async def intake(
    payload: ListingIntakeRequest,
    _seller: SellerDep,
) -> ListingIntakeResponse:
    return await listing_service.run_intake(payload)


@router.post("/listings", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
async def create_listing(
    payload: ListingCreate,
    seller: SellerDep,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PropertyRead:
    listing = await listing_service.create_listing(db, seller.id, payload)
    return PropertyRead.model_validate(listing)


@router.post("/listings/{property_id}/media", response_model=AttachMediaResponse)
async def attach_media(
    property_id: UUID,
    seller: SellerDep,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile,
    kind: Annotated[MediaKind, Form()] = MediaKind.photo,
) -> AttachMediaResponse:
    data = await file.read()
    try:
        media, warning = await listing_service.attach_media(
            db,
            property_id,
            seller.id,
            kind,
            file.filename or "upload",
            data,
            file.content_type or "application/octet-stream",
        )
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Listing not found") from exc
    except PermissionError as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your listing") from exc
    return AttachMediaResponse(media=MediaRead.model_validate(media), warning=warning)
