"""Seller Agent — House & Neighborhood Data Collector.

Implements the `Agent` Protocol (`app.agents.base.orchestrator`). Given a street
address, geocodes it and pulls structured facts from OpenStreetMap (the
building itself + nearby amenities), then asks Mistral to turn those raw facts
into a seller-facing summary. The LLM never invents data: it only rephrases
and organizes what OSM returned — see `prompts/seller/house_neighborhood_data_collector.md`.

Public APIs used: Nominatim (geocoding) and Overpass (POI queries). Both
public instances are rate-limited and meant for light/dev use (Nominatim's
usage policy caps at ~1 req/s, and Overpass's public instance occasionally
504s under load) — swap in a self-hosted instance or a commercial provider
before any real production traffic.
"""

import asyncio
import json
from collections import defaultdict
from collections.abc import Awaitable, Callable
from math import asin, cos, radians, sin, sqrt
from typing import Any, TypeVar

import httpx

from app.agents.base.client import get_mistral
from app.agents.base.prompts import load_prompt
from app.core.config import get_settings
from app.schemas.neighborhood import (
    AmenityCategory,
    AmenityCategoryName,
    BuildingInfo,
    Coordinates,
    GeocodedAddress,
    HouseNeighborhoodData,
    NearbyPlace,
    NeighborhoodInsights,
    RawNeighborhoodData,
)

_PROMPT = "seller/house_neighborhood_data_collector.md"

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_OVERPASS_URL = "https://overpass-api.de/api/interpreter"
_USER_AGENT = "immobilia-backend/0.1 (seller house-neighborhood-data-collector agent)"

_BUILDING_RADIUS_M = 30
_AMENITY_RADIUS_M = 800
_MAX_NEAREST_PER_CATEGORY = 3

_MAX_ATTEMPTS = 3
_RETRY_DELAY_S = 2.0

_T = TypeVar("_T")

_SCHOOL_AMENITIES = {"school", "kindergarten", "college", "university"}
_HEALTH_AMENITIES = {"hospital", "clinic", "pharmacy", "doctors"}
_TRANSIT_RAILWAY = {"station", "halt", "tram_stop"}
_GREEN_LEISURE = {"park", "garden"}


class HouseNeighborhoodDataCollectorAgent:
    name = "seller.house_neighborhood_data_collector"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        address = context.get("address")
        if not isinstance(address, str) or not address.strip():
            raise ValueError("context['address'] is required and must be a non-empty string")

        async with httpx.AsyncClient(headers={"User-Agent": _USER_AGENT}, timeout=30.0) as client:
            geocoded = await _with_retries(lambda: _geocode(client, address.strip()))
            elements = await _with_retries(lambda: _query_osm(client, geocoded.coordinates))

        raw = RawNeighborhoodData(
            address=geocoded,
            building=_extract_building(elements, geocoded.coordinates),
            search_radius_m=_AMENITY_RADIUS_M,
            amenities=_extract_amenities(elements, geocoded.coordinates),
        )
        insights = await _with_retries(lambda: _summarize(raw))
        return HouseNeighborhoodData(raw=raw, insights=insights).model_dump(mode="json")


async def _with_retries(call: Callable[[], Awaitable[_T]]) -> _T:
    """Retry `call` on transient network failures (timeouts, 5xx) — not on 4xx."""
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            return await call()
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            if attempt == _MAX_ATTEMPTS:
                raise
            last_error: Exception = exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code < 500 or attempt == _MAX_ATTEMPTS:
                raise
            last_error = exc
        await asyncio.sleep(_RETRY_DELAY_S * attempt)
    raise last_error


# ---- OSM: geocoding + Overpass --------------------------------------------


async def _geocode(client: httpx.AsyncClient, address: str) -> GeocodedAddress:
    response = await client.get(
        _NOMINATIM_URL,
        params={"q": address, "format": "jsonv2", "limit": 1},
    )
    response.raise_for_status()
    results: list[dict[str, Any]] = response.json()
    if not results:
        raise ValueError(f"No geocoding match for address: {address!r}")

    match = results[0]
    return GeocodedAddress(
        query=address,
        display_name=match["display_name"],
        coordinates=Coordinates(latitude=float(match["lat"]), longitude=float(match["lon"])),
    )


def _build_overpass_query(coords: Coordinates) -> str:
    lat, lon = coords.latitude, coords.longitude
    schools = "|".join(sorted(_SCHOOL_AMENITIES))
    health = "|".join(sorted(_HEALTH_AMENITIES))
    railway = "|".join(sorted(_TRANSIT_RAILWAY))
    leisure = "|".join(sorted(_GREEN_LEISURE))
    clauses = [
        f'way(around:{_BUILDING_RADIUS_M},{lat},{lon})["building"];',
        f'node(around:{_AMENITY_RADIUS_M},{lat},{lon})["amenity"~"^({schools})$"];',
        f'node(around:{_AMENITY_RADIUS_M},{lat},{lon})["amenity"~"^({health})$"];',
        f'node(around:{_AMENITY_RADIUS_M},{lat},{lon})["shop"];',
        f'node(around:{_AMENITY_RADIUS_M},{lat},{lon})["highway"="bus_stop"];',
        f'node(around:{_AMENITY_RADIUS_M},{lat},{lon})["railway"~"^({railway})$"];',
        f'node(around:{_AMENITY_RADIUS_M},{lat},{lon})["public_transport"="stop_position"];',
        f'node(around:{_AMENITY_RADIUS_M},{lat},{lon})["leisure"~"^({leisure})$"];',
    ]
    body = "\n  ".join(clauses)
    return f"[out:json][timeout:25];\n(\n  {body}\n);\nout tags center;"


async def _query_osm(client: httpx.AsyncClient, coords: Coordinates) -> list[dict[str, Any]]:
    response = await client.post(_OVERPASS_URL, data={"data": _build_overpass_query(coords)})
    response.raise_for_status()
    payload: dict[str, Any] = response.json()
    elements: list[dict[str, Any]] = payload.get("elements", [])
    return elements


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_m = 6_371_000.0
    phi1, phi2 = radians(lat1), radians(lat2)
    d_phi = radians(lat2 - lat1)
    d_lambda = radians(lon2 - lon1)
    a = sin(d_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(d_lambda / 2) ** 2
    return 2 * earth_radius_m * asin(sqrt(a))


def _element_position(element: dict[str, Any]) -> tuple[float, float] | None:
    if element.get("type") == "node":
        lat, lon = element.get("lat"), element.get("lon")
    else:
        center = element.get("center") or {}
        lat, lon = center.get("lat"), center.get("lon")
    if lat is None or lon is None:
        return None
    return float(lat), float(lon)


def _classify_amenity(tags: dict[str, str]) -> AmenityCategoryName | None:
    amenity = tags.get("amenity")
    if amenity in _SCHOOL_AMENITIES:
        return "schools"
    if amenity in _HEALTH_AMENITIES:
        return "health"
    if "shop" in tags:
        return "shops"
    if (
        tags.get("highway") == "bus_stop"
        or tags.get("railway") in _TRANSIT_RAILWAY
        or tags.get("public_transport") == "stop_position"
    ):
        return "transit"
    if tags.get("leisure") in _GREEN_LEISURE:
        return "green_spaces"
    return None


def _extract_building(elements: list[dict[str, Any]], coords: Coordinates) -> BuildingInfo | None:
    candidates = [
        el for el in elements if el.get("type") == "way" and "building" in el.get("tags", {})
    ]
    if not candidates:
        return None

    def distance(el: dict[str, Any]) -> float:
        position = _element_position(el)
        if position is None:
            return float("inf")
        return _haversine_m(coords.latitude, coords.longitude, *position)

    nearest = min(candidates, key=distance)
    tags: dict[str, str] = nearest.get("tags", {})
    building_type = tags.get("building")
    levels = tags.get("building:levels")
    flats = tags.get("building:flats")
    return BuildingInfo(
        osm_id=nearest["id"],
        building_type=building_type if building_type and building_type != "yes" else None,
        levels=int(levels) if levels and levels.isdigit() else None,
        flats=int(flats) if flats and flats.isdigit() else None,
        distance_m=round(distance(nearest), 1),
    )


def _extract_amenities(
    elements: list[dict[str, Any]], coords: Coordinates
) -> list[AmenityCategory]:
    buckets: dict[AmenityCategoryName, list[tuple[float, str | None]]] = defaultdict(list)
    for element in elements:
        tags: dict[str, str] = element.get("tags", {})
        category = _classify_amenity(tags)
        if category is None:
            continue
        position = _element_position(element)
        if position is None:
            continue
        distance = _haversine_m(coords.latitude, coords.longitude, *position)
        buckets[category].append((distance, tags.get("name")))

    categories: list[AmenityCategoryName] = [
        "schools",
        "health",
        "shops",
        "transit",
        "green_spaces",
    ]
    result = []
    for category in categories:
        hits = sorted(buckets.get(category, []), key=lambda hit: hit[0])
        nearest = [
            NearbyPlace(name=name, distance_m=round(distance, 1))
            for distance, name in hits[:_MAX_NEAREST_PER_CATEGORY]
        ]
        result.append(AmenityCategory(category=category, count=len(hits), nearest=nearest))
    return result


# ---- Mistral: raw data -> seller-facing insights ---------------------------


async def _summarize(raw: RawNeighborhoodData) -> NeighborhoodInsights:
    client = get_mistral()
    settings = get_settings()

    response = await client.chat.complete_async(
        model=settings.mistral_model,
        messages=[
            {"role": "system", "content": load_prompt(_PROMPT)},
            {"role": "user", "content": raw.model_dump_json()},
        ],
        response_format={"type": "json_object"},
    )

    choices = response.choices or []
    message = choices[0].message if choices else None
    content = message.content if message else None
    if not isinstance(content, str):
        raise ValueError("Mistral returned a non-text response")
    data: dict[str, Any] = json.loads(content)
    return NeighborhoodInsights.model_validate(data)
