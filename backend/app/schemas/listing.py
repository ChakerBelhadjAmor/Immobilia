"""Seller listing-intake schemas.

`ListingIntakeResponse` is the Agent-1 contract (extraction only — human-in-the-loop,
nothing persisted). `ListingCreate` is the human-confirmed payload that becomes a
`properties` row. AI fields (quality/honesty/price) are absent by design.
"""

from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import (
    EnergyClass,
    PropertyType,
    TransactionType,
)


class ListingIntakeRequest(BaseModel):
    transcript: str
    partial: dict[str, Any] | None = None
    existing_property_id: UUID | None = None


class ListingIntakeResponse(BaseModel):
    extracted: dict[str, Any]
    missing_fields: list[str]
    questions: list[str]


class ListingCreate(BaseModel):
    model_config = ConfigDict(use_enum_values=False)

    title: str
    description: str
    type: PropertyType
    transaction: TransactionType
    price: Decimal
    charges: Decimal | None = None
    surface: Decimal
    rooms: int
    bedrooms: int
    bathrooms: int
    floor: int | None = None
    year_built: int | None = None
    energy_class: EnergyClass | None = None
    address: str
    city: str
    postal_code: str
    neighborhood_id: UUID | None = None
    features: list[str] = []


class PropertyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    title: str
    description: str
    type: PropertyType
    transaction: TransactionType
    status: str
    price: Decimal
    surface: Decimal
    rooms: int
    bedrooms: int
    bathrooms: int
    city: str
    postal_code: str


class MediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    property_id: UUID
    kind: str
    storage_key: str
    position: int


class AttachMediaResponse(BaseModel):
    media: MediaRead
    warning: str | None = None
