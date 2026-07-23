"""Resolve a DVF comparable property either from an existing DB row (selected
from the list) or from a free-text address (geocoded on the fly, created if new).
"""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dvf_property import DvfProperty
from app.services.enrichment_sources import geocode_address


async def get_property_by_id(db: AsyncSession, property_id: uuid.UUID) -> DvfProperty | None:
    result = await db.execute(select(DvfProperty).where(DvfProperty.id == property_id))
    return result.scalar_one_or_none()


async def resolve_property_from_address(db: AsyncSession, address_text: str) -> DvfProperty | None:
    """Geocode a free-text address, reuse an existing nearby property if one
    already exists (avoids duplicate rows for the same real-world address),
    otherwise create a new minimal property record (no DVF price data).
    """
    geo = await geocode_address(address_text)
    if geo is None:
        return None

    # Reuse if we already have something essentially at this address
    existing = await db.execute(
        select(DvfProperty).where(
            DvfProperty.postcode == geo["postcode"],
            DvfProperty.address == geo["address"],
        )
    )
    match = existing.scalar_one_or_none()
    if match:
        return match

    prop = DvfProperty(
        address=geo["address"],
        lat=geo["lat"],
        lon=geo["lon"],
        postcode=geo["postcode"],
        citycode=geo["citycode"],
        city=geo["city"],
        price=None,
        surface=None,
        property_type=None,
        sale_date=None,
    )
    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    return prop
