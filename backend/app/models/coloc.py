"""Colocation & tools models (docs §2.6).

Tables: coloc_profiles (`tags` text[]), decoration_ideas, repair_findings,
staging_examples, generated_contracts (`content` jsonb). The Postgres-native
`ARRAY`/`JSONB` columns here are the reason the stack uses SQLAlchemy.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Numeric,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import IssueSeverity
from app.models.pg_types import issue_severity_enum


class ColocProfile(Base):
    __tablename__ = "coloc_profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    age: Mapped[int | None] = mapped_column(default=None)
    occupation: Mapped[str | None] = mapped_column(default=None)
    budget: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    city: Mapped[str | None] = mapped_column(default=None)
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    bio: Mapped[str | None] = mapped_column(default=None)


class DecorationIdea(Base):
    __tablename__ = "decoration_ideas"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str]
    style: Mapped[str | None] = mapped_column(default=None)
    budget: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    image_url: Mapped[str | None] = mapped_column(default=None)
    items: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, default=None)
    regulation_note: Mapped[str | None] = mapped_column(default=None)


class RepairFinding(Base):
    __tablename__ = "repair_findings"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), index=True)
    zone: Mapped[str]
    issue: Mapped[str]
    severity: Mapped[IssueSeverity] = mapped_column(issue_severity_enum)
    estimated_cost_min: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    estimated_cost_max: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    score_impact: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    price_impact: Mapped[Decimal | None] = mapped_column(Numeric, default=None)


class StagingExample(Base):
    __tablename__ = "staging_examples"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str]
    before_url: Mapped[str | None] = mapped_column(default=None)
    after_url: Mapped[str | None] = mapped_column(default=None)
    cost_estimate: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    value_gain: Mapped[Decimal | None] = mapped_column(Numeric, default=None)


class GeneratedContract(Base):
    __tablename__ = "generated_contracts"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), index=True)
    reference: Mapped[str | None] = mapped_column(default=None)
    content: Mapped[dict[str, Any]] = mapped_column(JSONB)
    verified: Mapped[bool] = mapped_column(default=False)
    verification_issues: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
