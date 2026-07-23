"""Enrichment orchestration: cache-first fetching per source, per property."""
import uuid
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dvf_property import DvfEnrichment, DvfProperty
from app.services import enrichment_sources as sources
from app.services.geo_utils import department_from_citycode

TTL = {
    "schools": timedelta(days=180),
    "universities": timedelta(days=180),
    "hospitals": timedelta(days=180),
    "noise": timedelta(days=365),
    "crime": timedelta(days=365),
    "air_quality": timedelta(hours=1),
}

_FETCHERS: dict[str, Callable[..., Any]] = {
    "schools": lambda p: sources.fetch_schools(p.lat, p.lon, p.postcode),
    "universities": lambda p: sources.fetch_universities(p.lat, p.lon, p.postcode),
    "hospitals": lambda p: sources.fetch_hospitals(p.lat, p.lon),
    "noise": lambda p: sources.fetch_noise(p.lat, p.lon),
    "air_quality": lambda p: sources.fetch_air_quality(p.lat, p.lon),
    "crime": lambda p: sources.fetch_crime(department_from_citycode(p.citycode, p.postcode)),
}


async def _get_cached(
    db: AsyncSession, property_id: uuid.UUID, source: str
) -> DvfEnrichment | None:
    result = await db.execute(
        select(DvfEnrichment).where(
            DvfEnrichment.property_id == property_id, DvfEnrichment.source == source
        )
    )
    return result.scalar_one_or_none()


def _is_fresh(enrichment: DvfEnrichment, source: str) -> bool:
    ttl = TTL.get(source)
    if ttl is None:
        return True
    return datetime.now(UTC) - enrichment.fetched_at.replace(tzinfo=UTC) < ttl


async def get_or_refresh_enrichment(db: AsyncSession, property_: DvfProperty, source: str) -> Any:
    cached = await _get_cached(db, property_.id, source)
    if cached and _is_fresh(cached, source):
        return cached.data

    fresh_data = await _FETCHERS[source](property_)

    if cached:
        cached.data = fresh_data
        cached.fetched_at = datetime.now(UTC)
    else:
        db.add(DvfEnrichment(property_id=property_.id, source=source, data=fresh_data))

    await db.commit()
    return fresh_data


async def enrich_property(db: AsyncSession, property_: DvfProperty) -> dict[str, Any]:
    """Fetch (or reuse cached) data from all 6 sources for one property."""
    result: dict[str, Any] = {}
    for source in TTL:
        result[source] = await get_or_refresh_enrichment(db, property_, source)
    return result
