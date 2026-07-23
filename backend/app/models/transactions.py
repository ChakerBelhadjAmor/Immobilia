"""Transactions & social proof models (docs §2.3).

Tables: offers, reviews, abuse_reports, competitor_listings. `competitor_listings`
is a cache of scraped comparables (EF-V-04).
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Numeric,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import (
    AbuseKind,
    AbuseStatus,
    OfferStatus,
    PropertySource,
)
from app.models.pg_types import (
    abuse_kind_enum,
    abuse_status_enum,
    offer_status_enum,
    property_source_enum,
)


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), index=True)
    buyer_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric)
    status: Mapped[OfferStatus] = mapped_column(offer_status_enum, default=OfferStatus.en_attente)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), index=True)
    author_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    rating: Mapped[int]
    comment: Mapped[str]
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AbuseReport(Base):
    __tablename__ = "abuse_reports"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), index=True)
    reporter_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[AbuseKind] = mapped_column(abuse_kind_enum)
    reason: Mapped[str]
    status: Mapped[AbuseStatus] = mapped_column(abuse_status_enum, default=AbuseStatus.en_cours)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CompetitorListing(Base):
    __tablename__ = "competitor_listings"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), index=True)
    title: Mapped[str]
    price: Mapped[Decimal] = mapped_column(Numeric)
    surface: Mapped[Decimal] = mapped_column(Numeric)
    price_per_sqm: Mapped[Decimal] = mapped_column(Numeric)
    distance_km: Mapped[Decimal] = mapped_column(Numeric)
    image_url: Mapped[str | None] = mapped_column(default=None)
    source: Mapped[PropertySource] = mapped_column(property_source_enum)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
