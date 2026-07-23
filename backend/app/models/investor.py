"""Investor module models (docs §2.5).

Tables: investment_reports (regenerated on demand), risk_factors, what_if_scenarios.
All numbers here are AI-computed by the investor agent, not user input.
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
from app.models.enums import RiskLevel
from app.models.pg_types import risk_level_enum


class InvestmentReport(Base):
    __tablename__ = "investment_reports"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), index=True)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    gross_yield: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    net_yield: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    monthly_rent: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    annual_costs: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    cashflow: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    payback_years: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    risk_score: Mapped[int | None] = mapped_column(default=None)
    forecast_now: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    forecast_5y: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    forecast_10y: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    annual_growth_percent: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    summary: Mapped[str | None] = mapped_column(default=None)


class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(ForeignKey("investment_reports.id"), index=True)
    label: Mapped[str]
    level: Mapped[RiskLevel] = mapped_column(risk_level_enum)
    detail: Mapped[str | None] = mapped_column(default=None)


class WhatIfScenario(Base):
    __tablename__ = "what_if_scenarios"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(ForeignKey("investment_reports.id"), index=True)
    label: Mapped[str]
    description: Mapped[str | None] = mapped_column(default=None)
    delta_yield: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
    delta_value: Mapped[Decimal | None] = mapped_column(Numeric, default=None)
