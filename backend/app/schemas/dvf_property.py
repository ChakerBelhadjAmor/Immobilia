"""Pydantic response schemas for the DVF comparable-properties endpoint."""
import uuid
from datetime import date

from pydantic import BaseModel


class DvfPropertyOut(BaseModel):
    id: uuid.UUID
    address: str
    city: str | None
    lat: float | None
    lon: float | None
    price: float | None
    surface: float | None
    property_type: str | None
    sale_date: date | None

    model_config = {"from_attributes": True}
