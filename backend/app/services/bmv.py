"""Below-Market-Value (BMV) detection — deterministic, no LLM involved.

A low price alone never qualifies a property as BMV. Classification requires a
comparison between `listing_price` and an `estimated_market_value` (mirrors
`properties.ai_price_estimate`, docs §2) that must come from elsewhere in the
system, never from this module or from user input. All arithmetic here is plain
Python: discount thresholds and comparisons are exactly the kind of logic the
task description says must not be delegated to the LLM.
"""

from app.schemas.investor import BMVResult, PropertySnapshot, RiskLevel

DEFAULT_MIN_DISCOUNT_THRESHOLD_PCT = 10.0
_LOW_COMPARABLE_COUNT = 3


def calculate_estimated_discount_percentage(
    listing_price: float,
    estimated_market_value: float | None,
) -> float | None:
    """`(estimated_market_value - listing_price) / estimated_market_value * 100`.

    Returns None when the market value is missing, zero, or negative — a
    discount percentage is meaningless against a non-positive baseline.
    """
    if estimated_market_value is None or estimated_market_value <= 0:
        return None
    return (estimated_market_value - listing_price) / estimated_market_value * 100


def _confidence_for(prop: PropertySnapshot, discount: float | None) -> RiskLevel:
    if discount is None:
        return RiskLevel.LOW
    if prop.comparable_count is not None and prop.comparable_count >= _LOW_COMPARABLE_COUNT:
        return RiskLevel.HIGH
    if prop.comparable_count is not None and prop.comparable_count > 0:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def _risk_level_for(prop: PropertySnapshot, discount: float | None) -> RiskLevel:
    if discount is None:
        return RiskLevel.HIGH
    poor_condition = prop.condition is not None and prop.condition.lower() in {
        "poor",
        "to renovate",
    }
    if prop.renovation_required or poor_condition:
        return RiskLevel.HIGH
    if discount >= 25:
        # An unusually large discount is itself a risk signal worth flagging,
        # not an automatic reason for higher confidence.
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def evaluate_property(
    prop: PropertySnapshot,
    min_discount_threshold_pct: float = DEFAULT_MIN_DISCOUNT_THRESHOLD_PCT,
) -> BMVResult:
    """Explainable, deterministic BMV classification for a single property."""
    discount = calculate_estimated_discount_percentage(
        prop.listing_price, prop.estimated_market_value
    )
    is_bmv = discount is not None and discount >= min_discount_threshold_pct

    missing_data: list[str] = []
    if prop.estimated_market_value is None:
        missing_data.append("estimated_market_value is not available")
    if prop.comparable_count is None:
        missing_data.append("no comparable-listing count supplied")

    reasons_undervalued: list[str] = []
    comparable_evidence: list[str] = []
    risks: list[str] = []
    false_positive_reasons: list[str] = []

    if discount is not None:
        reasons_undervalued.append(
            f"Listing price is {discount:.1f}% below the estimated market value."
        )
    if prop.price_per_sqm is not None:
        comparable_evidence.append(f"Listed at {prop.price_per_sqm:.0f} per sqm.")
    if prop.comparable_count:
        comparable_evidence.append(f"Compared against {prop.comparable_count} comparable listings.")

    risks.append("estimated_market_value is a model estimate, not a certified valuation.")
    if prop.renovation_required:
        risks.append("Property requires renovation; costs are not netted out of this discount.")
    if prop.comparable_count is not None and prop.comparable_count < _LOW_COMPARABLE_COUNT:
        risks.append("Few comparable listings back this estimate; treat the discount with caution.")

    false_positive_reasons.append(
        "The discount may reflect genuine defects (condition, location, legal status) "
        "rather than true undervaluation."
    )
    if prop.estimated_market_value is None:
        false_positive_reasons.append(
            "No market-value estimate was available, so BMV status could not be confirmed."
        )
    if prop.comparable_count is not None and prop.comparable_count < _LOW_COMPARABLE_COUNT:
        false_positive_reasons.append(
            "Small comparable sample may not represent the true local market."
        )

    return BMVResult(
        property_id=prop.property_id,
        listing_price=prop.listing_price,
        estimated_market_value=prop.estimated_market_value,
        estimated_discount_percentage=discount,
        is_bmv=is_bmv,
        confidence=_confidence_for(prop, discount),
        risk_level=_risk_level_for(prop, discount),
        reasons_undervalued=reasons_undervalued,
        comparable_evidence=comparable_evidence,
        risks=risks,
        false_positive_reasons=false_positive_reasons,
        missing_data=missing_data,
        expected_yield_pct=prop.expected_yield_pct,
    )


def rank_bmv_opportunities(
    properties: list[PropertySnapshot],
    min_discount_threshold_pct: float = DEFAULT_MIN_DISCOUNT_THRESHOLD_PCT,
) -> list[BMVResult]:
    """Evaluate every property and sort BMV opportunities first, by discount desc."""
    results = [evaluate_property(p, min_discount_threshold_pct) for p in properties]

    def sort_key(result: BMVResult) -> tuple[bool, float]:
        discount = result.estimated_discount_percentage
        return (not result.is_bmv, -(discount if discount is not None else float("-inf")))

    return sorted(results, key=sort_key)
