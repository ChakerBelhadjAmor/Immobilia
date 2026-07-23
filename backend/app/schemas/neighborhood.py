"""House & Neighborhood Data Collector schemas (seller agent).

`RawNeighborhoodData` is pulled straight from OpenStreetMap (geocoding +
Overpass) — no LLM involved in producing it. `NeighborhoodInsights` is the
Mistral-authored synthesis, grounded in `RawNeighborhoodData` only (the system
prompt forbids inventing facts not present there).
"""

from typing import Literal

from pydantic import BaseModel, Field

AmenityCategoryName = Literal["schools", "health", "shops", "transit", "green_spaces"]


class Coordinates(BaseModel):
    latitude: float
    longitude: float


class GeocodedAddress(BaseModel):
    query: str
    display_name: str
    coordinates: Coordinates


class BuildingInfo(BaseModel):
    osm_id: int
    building_type: str | None = None
    levels: int | None = None
    flats: int | None = None
    distance_m: float


class NearbyPlace(BaseModel):
    name: str | None
    distance_m: float


class AmenityCategory(BaseModel):
    category: AmenityCategoryName
    count: int
    nearest: list[NearbyPlace] = Field(default_factory=list)


class RawNeighborhoodData(BaseModel):
    address: GeocodedAddress
    building: BuildingInfo | None
    search_radius_m: int
    amenities: list[AmenityCategory]


class NeighborhoodInsights(BaseModel):
    summary: str
    highlights: list[str] = Field(default_factory=list)
    caveats: list[str] = Field(default_factory=list)


class HouseNeighborhoodData(BaseModel):
    raw: RawNeighborhoodData
    insights: NeighborhoodInsights
