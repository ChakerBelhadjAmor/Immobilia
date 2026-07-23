"""Investor-agent request/response schemas (Agent 2: Dealing + Portfolio).

Covers three capabilities: portfolio strategy proposals, BMV (below-market-value)
deal ranking, and saved alert rules / triggered notifications. `city`,
`property_type`, and `transaction_type` are kept as free-form `str` rather than
enums: the authoritative `properties` table (docs §2) is not implemented yet, so
the real value sets are unknown and must not be guessed. AI-written valuation
fields (`estimated_market_value`, mirroring `properties.ai_price_estimate`) are
only ever read here, never accepted as a trusted "fact" without the caveats this
module attaches to them.
"""

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ---- Shared vocabulary -----------------------------------------------------


class RiskTolerance(StrEnum):
    CONSERVATIVE = "conservative"
    BALANCED = "balanced"
    AGGRESSIVE = "aggressive"


class LiquidityPreference(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


_RISK_LEVEL_RANK: dict[RiskLevel, int] = {
    RiskLevel.LOW: 0,
    RiskLevel.MEDIUM: 1,
    RiskLevel.HIGH: 2,
}


def risk_level_rank(level: RiskLevel) -> int:
    """Ordinal rank for comparing risk levels (LOW < MEDIUM < HIGH)."""
    return _RISK_LEVEL_RANK[level]


class StrategyPattern(StrEnum):
    LONG_TERM_BUY_TO_LET = "long_term_buy_to_let"
    VALUE_ADD_RENOVATION = "value_add_renovation"
    BMV_ACQUISITION_AND_HOLD = "bmv_acquisition_and_hold"
    GEOGRAPHIC_DIVERSIFICATION = "geographic_diversification"
    PROPERTY_TYPE_DIVERSIFICATION = "property_type_diversification"
    INCOME_FOCUSED = "income_focused"
    APPRECIATION_FOCUSED = "appreciation_focused"
    CONSERVATIVE_ALLOCATION = "conservative_allocation"
    BALANCED_ALLOCATION = "balanced_allocation"
    AGGRESSIVE_ALLOCATION = "aggressive_allocation"


# ---- A. Portfolio strategy --------------------------------------------------


class PortfolioExposureItem(BaseModel):
    """One line of the investor's self-reported existing holdings. Optional context."""

    property_type: str | None = None
    city: str | None = None
    share_of_portfolio_pct: float | None = Field(default=None, ge=0, le=100)


class InvestorProfile(BaseModel):
    """Inputs actually available for strategy generation. Only budget is required —
    everything else is optional and must be handled safely when absent."""

    available_budget: float = Field(gt=0)
    investment_horizon_years: float | None = Field(default=None, gt=0)
    risk_tolerance: RiskTolerance | None = None
    preferred_property_types: list[str] | None = None
    preferred_cities: list[str] | None = None
    target_rental_yield_pct: float | None = Field(default=None, ge=0)
    target_capital_appreciation_pct: float | None = Field(default=None, ge=0)
    existing_portfolio_exposure: list[PortfolioExposureItem] | None = None
    financing_constraints: str | None = None
    liquidity_preference: LiquidityPreference | None = None


class SuggestedAllocation(BaseModel):
    category: str
    target_percentage: float = Field(ge=0, le=100)
    note: str | None = None


class SearchCriteria(BaseModel):
    """Search parameters derived from the strategy, meant to seed a BMV/property search."""

    cities: list[str] | None = None
    property_types: list[str] | None = None
    max_price: float | None = Field(default=None, ge=0)
    min_expected_yield_pct: float | None = Field(default=None, ge=0)


class PortfolioStrategy(BaseModel):
    strategy_name: str
    strategy_pattern: StrategyPattern
    summary: str
    rationale: str
    suggested_allocation: list[SuggestedAllocation]
    target_property_characteristics: list[str]
    expected_advantages: list[str]
    key_risks: list[str]
    suggested_horizon_years: float | None = None
    search_criteria: SearchCriteria
    assumptions: list[str]
    limitations: list[str]


class PortfolioStrategyRequest(BaseModel):
    investor_profile: InvestorProfile


class PortfolioStrategyResponse(BaseModel):
    strategy: PortfolioStrategy
    generated_by: Literal["mistral", "fallback"]
    generation_notes: list[str] = Field(default_factory=list)


# ---- B. BMV deal identification --------------------------------------------


class PropertySnapshot(BaseModel):
    """Property facts as returned by `PropertyValuationRepository` (internal only).

    Not an ORM model — Agent 2 does not own or duplicate property persistence.
    `estimated_market_value` mirrors `properties.ai_price_estimate` (docs §2):
    AI-written, must never be trusted as user input. This is why no public
    request schema embeds `PropertySnapshot` directly — see `BMVRankingRequest`
    and `AlertEvaluationRequest`, which only accept property ids.
    """

    property_id: str
    listing_price: float = Field(ge=0)
    estimated_market_value: float | None = Field(default=None)
    price_per_sqm: float | None = None
    property_type: str | None = None
    transaction_type: str | None = None
    city: str | None = None
    size_sqm: float | None = None
    features: list[str] | None = None
    condition: str | None = None
    renovation_required: bool | None = None
    comparable_count: int | None = Field(default=None, ge=0)
    expected_yield_pct: float | None = Field(default=None, ge=0)


class BMVResult(BaseModel):
    property_id: str
    listing_price: float
    estimated_market_value: float | None
    estimated_discount_percentage: float | None
    is_bmv: bool
    confidence: RiskLevel
    risk_level: RiskLevel
    reasons_undervalued: list[str]
    comparable_evidence: list[str]
    risks: list[str]
    false_positive_reasons: list[str]
    missing_data: list[str]
    expected_yield_pct: float | None = None


class BMVRankingRequest(BaseModel):
    """Clients name properties by id; trusted listing/valuation facts are
    always looked up server-side via `PropertyValuationRepository` — never
    accepted from the request body. `extra="forbid"` rejects any attempt to
    smuggle a valuation field (e.g. `estimated_market_value`) in here."""

    model_config = ConfigDict(extra="forbid")

    property_ids: list[str]
    min_discount_threshold_pct: float = Field(default=10.0, ge=0, le=100)


class BMVRankingResponse(BaseModel):
    results: list[BMVResult]


# ---- C. Alert rules & notifications -----------------------------------------


class AlertCriteria(BaseModel):
    """Every field optional and independently applied — an unset field is ignored."""

    city: str | None = None
    property_type: str | None = None
    transaction_type: str | None = None
    max_price: float | None = Field(default=None, ge=0)
    min_discount_percentage: float | None = Field(default=None, ge=0, le=100)
    min_expected_yield_pct: float | None = Field(default=None, ge=0)
    max_risk_level: RiskLevel | None = None
    preferred_strategy: StrategyPattern | None = None


class AlertRuleCreate(BaseModel):
    name: str
    criteria: AlertCriteria
    is_active: bool = True


class AlertRuleUpdate(BaseModel):
    name: str | None = None
    criteria: AlertCriteria | None = None
    is_active: bool | None = None


class AlertRule(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investor_id: str
    name: str
    criteria: AlertCriteria
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MatchState(BaseModel):
    """Last known evaluation outcome for one (rule, property) pair — the dedup seam."""

    property_id: str
    matched: bool
    listing_price: float
    estimated_discount_percentage: float | None
    is_bmv: bool
    evaluated_at: datetime


NotificationEventType = Literal[
    "new_match",
    "material_change",
    "no_longer_matches",
]


class TriggeredNotification(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investor_id: str
    rule_id: str
    property_id: str
    event_type: NotificationEventType
    reason: str
    triggered_at: datetime


class AlertEvaluationRequest(BaseModel):
    """Same trust boundary as `BMVRankingRequest`: candidates are named by id,
    never supplied with client-controlled valuation facts."""

    model_config = ConfigDict(extra="forbid")

    candidate_property_ids: list[str]
    min_discount_threshold_pct: float = Field(default=10.0, ge=0, le=100)


class AlertEvaluationResult(BaseModel):
    rule_id: str
    evaluated_at: datetime
    matched_property_ids: list[str]
    notifications: list[TriggeredNotification]
