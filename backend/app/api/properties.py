"""Endpoints for browsing DVF comparable properties (chat-comparison agent)."""
import uuid
from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.dvf_property import DvfProperty
from app.schemas.dvf_property import DvfPropertyOut

router = APIRouter(prefix="/dvf-properties", tags=["dvf-properties"])


@router.get("", response_model=list[DvfPropertyOut])
async def list_properties(
    city: str | None = None,
    property_type: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
) -> Sequence[DvfProperty]:
    stmt = select(DvfProperty)
    if city:
        stmt = stmt.where(DvfProperty.city == city)
    if property_type:
        stmt = stmt.where(DvfProperty.property_type == property_type)
    if min_price is not None:
        stmt = stmt.where(DvfProperty.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(DvfProperty.price <= max_price)
    stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{property_id}", response_model=DvfPropertyOut)
async def get_property(property_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> DvfProperty:
    result = await db.execute(select(DvfProperty).where(DvfProperty.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop
