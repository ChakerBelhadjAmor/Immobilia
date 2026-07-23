"""DVF-scraped comparable property and enrichment models.

Distinct from `app.models.properties.Property` (seller-listed inventory):
these rows are read-only comparables sourced from the French DVF open
dataset, used by the multi-property comparison chat agent. Kept in their
own table to avoid colliding with the listing schema.
"""
import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class DvfProperty(Base):
    __tablename__ = "dvf_properties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dvf_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    address: Mapped[str] = mapped_column(String, nullable=False)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    postcode: Mapped[str | None] = mapped_column(String, nullable=True)
    citycode: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    surface: Mapped[float | None] = mapped_column(Float, nullable=True)
    property_type: Mapped[str | None] = mapped_column(String, nullable=True)
    sale_date: Mapped[date | None] = mapped_column(nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    enrichments: Mapped[list["DvfEnrichment"]] = relationship(back_populates="property")


class DvfEnrichment(Base):
    __tablename__ = "dvf_enrichments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dvf_properties.id"), nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)
    data: Mapped[Any] = mapped_column(JSON, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    property: Mapped["DvfProperty"] = relationship(back_populates="enrichments")
