"""Shared SQLAlchemy Enum column types.

One `Enum` *instance* per PG type, reused across every column. Sharing the single
instance is what lets `Base.metadata.create_all` (tests) emit each `CREATE TYPE`
exactly once — notably `property_source`, used by both `properties` and
`competitor_listings`. Instances are intentionally *not* bound to a MetaData:
binding makes Alembic render a bogus `metadata=MetaData()` kwarg. The Alembic
migration handles the one cross-table reuse with `create_type=False` instead.
"""

from sqlalchemy import Enum as SAEnum

from app.models.enums import (
    AbuseKind,
    AbuseStatus,
    EnergyClass,
    IssueSeverity,
    MediaKind,
    NeighborhoodTrend,
    NotificationKind,
    OfferStatus,
    PoiKind,
    PropertySource,
    PropertyStatus,
    PropertyType,
    RiskLevel,
    TransactionType,
    UserRole,
)

user_role_enum = SAEnum(UserRole, name="user_role")
property_type_enum = SAEnum(PropertyType, name="property_type")
transaction_type_enum = SAEnum(TransactionType, name="transaction_type")
property_status_enum = SAEnum(PropertyStatus, name="property_status")
energy_class_enum = SAEnum(EnergyClass, name="energy_class")
property_source_enum = SAEnum(PropertySource, name="property_source")
media_kind_enum = SAEnum(MediaKind, name="media_kind")
poi_kind_enum = SAEnum(PoiKind, name="poi_kind")
neighborhood_trend_enum = SAEnum(NeighborhoodTrend, name="neighborhood_trend")
offer_status_enum = SAEnum(OfferStatus, name="offer_status")
abuse_kind_enum = SAEnum(AbuseKind, name="abuse_kind")
abuse_status_enum = SAEnum(AbuseStatus, name="abuse_status")
notification_kind_enum = SAEnum(NotificationKind, name="notification_kind")
risk_level_enum = SAEnum(RiskLevel, name="risk_level")
issue_severity_enum = SAEnum(IssueSeverity, name="issue_severity")
