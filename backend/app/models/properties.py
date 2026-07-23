"""Properties & location models (docs §2.2).

Tables: neighborhoods, points_of_interest, properties, property_media,
property_features, favorites. AI-written fields (`quality_score`, `honesty_score`,
`ai_price_estimate`, `availability_verified`) stay nullable — Agent 1 never sets
them; Agents 2/5 do. Media rows hold a MinIO `storage_key`, never bytes.
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
    EnergyClass,
    MediaKind,
    NeighborhoodTrend,
    PoiKind,
    PropertySource,
    PropertyStatus,
    PropertyType,
    TransactionType,
)
from app.models.pg_types import (
    energy_class_enum,
    media_kind_enum,
    neighborhood_trend_enum,
    poi_kind_enum,
    property_source_enum,
    property_status_enum,
    property_type_enum,
    transaction_type_enum,
)


class Neighborhood(Base):
    __tablename__ = "neighborhoods"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str]
    city: Mapped[str]
    score_overall: Mapped[Decimal] = mapped_column(Numeric, default=Decimal(0))
    score_securite: Mapped[Decimal] = mapped_column(Numeric, default=Decimal(0))
    score_transport: Mapped[Decimal] = mapped_column(Numeric, default=Decimal(0))
    score_bruit: Mapped[Decimal] = mapped_column(Numeric, default=Decimal(0))
    score_commerces: Mapped[Decimal] = mapped_column(Numeric, default=Decimal(0))
    score_ecoles: Mapped[Decimal] = mapped_column(Numeric, default=Decimal(0))
    flagged: Mapped[bool] = mapped_column(default=False)
    flag_reason: Mapped[str | None] = mapped_column(default=None)
    trend: Mapped[NeighborhoodTrend] = mapped_column(neighborhood_trend_enum)
    price_per_sqm: Mapped[Decimal | None] = mapped_column(Numeric, default=None)


class PointOfInterest(Base):
    __tablename__ = "points_of_interest"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    neighborhood_id: Mapped[UUID] = mapped_column(ForeignKey("neighborhoods.id"))
    kind: Mapped[PoiKind] = mapped_column(poi_kind_enum)
    label: Mapped[str]
    position_x: Mapped[Decimal] = mapped_column(Numeric)
    position_y: Mapped[Decimal] = mapped_column(Numeric)
    distance_min: Mapped[int]
    negative: Mapped[bool] = mapped_column(default=False)


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str]
    description: Mapped[str]
    type: Mapped[PropertyType] = mapped_column(property_type_enum)
    transaction: Mapped[TransactionType] = mapped_column(transaction_type_enum)
    status: Mapped[PropertyStatus] = mapped_column(property_status_enum)
    price: Mapped[Decimal] = mapped_column(Numeric)
    charges: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    surface: Mapped[Decimal] = mapped_column(Numeric)
    rooms: Mapped[int]
    bedrooms: Mapped[int]
    bathrooms: Mapped[int]
    floor: Mapped[int | None] = mapped_column(default=None)
    year_built: Mapped[int | None] = mapped_column(default=None)
    energy_class: Mapped[EnergyClass | None] = mapped_column(energy_class_enum, default=None)
    address: Mapped[str]
    city: Mapped[str]
    postal_code: Mapped[str]
    neighborhood_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("neighborhoods.id"), default=None
    )
    position_x: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    position_y: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    source: Mapped[PropertySource] = mapped_column(
        property_source_enum, default=PropertySource.plateforme
    )
    source_name: Mapped[str | None] = mapped_column(default=None)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    # AI-written (Agents 2/5) — never set by Agent 1.
    quality_score: Mapped[int | None] = mapped_column(default=None)
    honesty_score: Mapped[int | None] = mapped_column(default=None)
    ai_price_estimate: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    view_count: Mapped[int] = mapped_column(default=0)
    favorite_count: Mapped[int] = mapped_column(default=0)
    availability_verified: Mapped[bool | None] = mapped_column(default=None)


class PropertyMedia(Base):
    __tablename__ = "property_media"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), index=True)
    kind: Mapped[MediaKind] = mapped_column(media_kind_enum)
    storage_key: Mapped[str]
    position: Mapped[int] = mapped_column(default=0)


class PropertyFeature(Base):
    __tablename__ = "property_features"

    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), primary_key=True)
    feature: Mapped[str] = mapped_column(primary_key=True)


class Favorite(Base):
    __tablename__ = "favorites"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
