"""Deterministic BMV calculation tests — no network, no DB, no Mistral."""

import pytest

from app.schemas.investor import PropertySnapshot, RiskLevel
from app.services.bmv import (
    calculate_estimated_discount_percentage,
    evaluate_property,
    rank_bmv_opportunities,
)


def make_property(**overrides: object) -> PropertySnapshot:
    defaults: dict[str, object] = {
        "property_id": "p1",
        "listing_price": 100_000.0,
    }
    defaults.update(overrides)
    return PropertySnapshot.model_validate(defaults)


class TestCalculateEstimatedDiscountPercentage:
    def test_listing_below_market_value_is_positive_discount(self) -> None:
        assert calculate_estimated_discount_percentage(80_000, 100_000) == pytest.approx(20.0)

    def test_listing_equal_to_market_value_is_zero_discount(self) -> None:
        assert calculate_estimated_discount_percentage(100_000, 100_000) == pytest.approx(0.0)

    def test_listing_above_market_value_is_negative_discount(self) -> None:
        assert calculate_estimated_discount_percentage(120_000, 100_000) == pytest.approx(-20.0)

    def test_missing_market_value_returns_none(self) -> None:
        assert calculate_estimated_discount_percentage(80_000, None) is None

    def test_zero_market_value_returns_none(self) -> None:
        assert calculate_estimated_discount_percentage(80_000, 0) is None

    def test_negative_market_value_returns_none(self) -> None:
        assert calculate_estimated_discount_percentage(80_000, -1) is None


class TestEvaluateProperty:
    def test_below_threshold_is_not_bmv(self) -> None:
        prop = make_property(listing_price=95_000, estimated_market_value=100_000)
        result = evaluate_property(prop, min_discount_threshold_pct=10.0)
        assert result.is_bmv is False

    def test_at_threshold_boundary_is_bmv(self) -> None:
        prop = make_property(listing_price=90_000, estimated_market_value=100_000)
        result = evaluate_property(prop, min_discount_threshold_pct=10.0)
        assert result.estimated_discount_percentage == pytest.approx(10.0)
        assert result.is_bmv is True

    def test_just_under_threshold_is_not_bmv(self) -> None:
        prop = make_property(listing_price=90_001, estimated_market_value=100_000)
        result = evaluate_property(prop, min_discount_threshold_pct=10.0)
        assert result.is_bmv is False

    def test_missing_market_value_never_classified_as_bmv(self) -> None:
        prop = make_property(listing_price=1.0)  # implausibly cheap, but no valuation signal
        result = evaluate_property(prop)
        assert result.is_bmv is False
        assert result.estimated_discount_percentage is None
        assert "estimated_market_value is not available" in result.missing_data

    def test_low_price_alone_is_not_sufficient(self) -> None:
        """A low price with no market-value comparison must not be flagged BMV."""
        prop = make_property(listing_price=10_000, estimated_market_value=None)
        result = evaluate_property(prop)
        assert result.is_bmv is False

    def test_confidence_high_with_enough_comparables(self) -> None:
        prop = make_property(
            listing_price=80_000, estimated_market_value=100_000, comparable_count=5
        )
        result = evaluate_property(prop)
        assert result.confidence == RiskLevel.HIGH

    def test_confidence_low_with_no_comparables(self) -> None:
        prop = make_property(listing_price=80_000, estimated_market_value=100_000)
        result = evaluate_property(prop)
        assert result.confidence == RiskLevel.LOW

    def test_renovation_required_raises_risk_level(self) -> None:
        prop = make_property(
            listing_price=80_000, estimated_market_value=100_000, renovation_required=True
        )
        result = evaluate_property(prop)
        assert result.risk_level == RiskLevel.HIGH

    def test_output_separates_evidence_risks_and_missing_data(self) -> None:
        prop = make_property(listing_price=80_000, estimated_market_value=100_000)
        result = evaluate_property(prop)
        assert result.reasons_undervalued
        assert result.risks
        assert result.false_positive_reasons
        assert isinstance(result.missing_data, list)

    def test_never_guarantees_bargain(self) -> None:
        prop = make_property(listing_price=50_000, estimated_market_value=100_000)
        result = evaluate_property(prop)
        joined = " ".join(result.risks + result.false_positive_reasons).lower()
        assert "estimate" in joined  # always caveats that the valuation is a model estimate


class TestRankBmvOpportunities:
    def test_bmv_properties_sort_before_non_bmv(self) -> None:
        properties = [
            make_property(
                property_id="not_bmv", listing_price=99_000, estimated_market_value=100_000
            ),
            make_property(
                property_id="is_bmv", listing_price=70_000, estimated_market_value=100_000
            ),
        ]
        ranked = rank_bmv_opportunities(properties, min_discount_threshold_pct=10.0)
        assert [r.property_id for r in ranked] == ["is_bmv", "not_bmv"]

    def test_higher_discount_sorts_first_among_bmv(self) -> None:
        properties = [
            make_property(
                property_id="small_discount", listing_price=85_000, estimated_market_value=100_000
            ),
            make_property(
                property_id="big_discount", listing_price=60_000, estimated_market_value=100_000
            ),
        ]
        ranked = rank_bmv_opportunities(properties, min_discount_threshold_pct=10.0)
        assert [r.property_id for r in ranked] == ["big_discount", "small_discount"]

    def test_missing_valuation_sorts_last(self) -> None:
        properties = [
            make_property(
                property_id="no_valuation", listing_price=50_000, estimated_market_value=None
            ),
            make_property(
                property_id="valued", listing_price=70_000, estimated_market_value=100_000
            ),
        ]
        ranked = rank_bmv_opportunities(properties)
        assert ranked[-1].property_id == "no_valuation"
