"""Deterministic alert-matching and evaluation tests."""

from datetime import UTC, datetime

from app.schemas.investor import (
    AlertCriteria,
    AlertRule,
    MatchState,
    PropertySnapshot,
    RiskLevel,
)
from app.services.bmv import evaluate_property
from app.services.investment_alerts import evaluate_alert_rule, property_matches_rule


def make_property(**overrides: object) -> PropertySnapshot:
    defaults: dict[str, object] = {"property_id": "p1", "listing_price": 100_000.0}
    defaults.update(overrides)
    return PropertySnapshot.model_validate(defaults)


def make_rule(**overrides: object) -> AlertRule:
    now = datetime.now(UTC)
    defaults: dict[str, object] = {
        "id": "rule1",
        "investor_id": "investor1",
        "name": "Paris apartments under 300k",
        "criteria": AlertCriteria(),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    defaults.update(overrides)
    return AlertRule.model_validate(defaults)


class TestPropertyMatchesRule:
    def test_matches_all_criteria(self) -> None:
        prop = make_property(city="Paris", property_type="apartment", listing_price=250_000)
        criteria = AlertCriteria(city="Paris", property_type="apartment", max_price=300_000)
        outcome = property_matches_rule(prop, criteria, bmv=None)
        assert outcome.matches is True
        assert outcome.failed_criteria == []

    def test_fails_one_criterion(self) -> None:
        prop = make_property(city="Lyon", listing_price=250_000)
        criteria = AlertCriteria(city="Paris", max_price=300_000)
        outcome = property_matches_rule(prop, criteria, bmv=None)
        assert outcome.matches is False
        assert outcome.failed_criteria == ["city"]

    def test_unset_criteria_are_ignored(self) -> None:
        prop = make_property(city="Anywhere", listing_price=1_000_000)
        outcome = property_matches_rule(prop, AlertCriteria(), bmv=None)
        assert outcome.matches is True

    def test_max_price_boundary_is_inclusive(self) -> None:
        prop = make_property(listing_price=300_000)
        criteria = AlertCriteria(max_price=300_000)
        assert property_matches_rule(prop, criteria, bmv=None).matches is True

    def test_max_price_just_over_boundary_fails(self) -> None:
        prop = make_property(listing_price=300_000.01)
        criteria = AlertCriteria(max_price=300_000)
        assert property_matches_rule(prop, criteria, bmv=None).matches is False

    def test_min_discount_requires_bmv_result(self) -> None:
        prop = make_property(listing_price=80_000)
        criteria = AlertCriteria(min_discount_percentage=10.0)
        assert property_matches_rule(prop, criteria, bmv=None).matches is False

    def test_min_discount_boundary_is_inclusive(self) -> None:
        prop = make_property(listing_price=90_000, estimated_market_value=100_000)
        bmv = evaluate_property(prop)
        criteria = AlertCriteria(min_discount_percentage=10.0)
        assert property_matches_rule(prop, criteria, bmv).matches is True

    def test_max_risk_level_boundary(self) -> None:
        prop = make_property(listing_price=80_000, estimated_market_value=100_000)
        bmv = evaluate_property(prop)
        criteria_ok = AlertCriteria(max_risk_level=bmv.risk_level)
        assert property_matches_rule(prop, criteria_ok, bmv).matches is True

        if bmv.risk_level != RiskLevel.LOW:
            criteria_too_strict = AlertCriteria(max_risk_level=RiskLevel.LOW)
            if bmv.risk_level == RiskLevel.HIGH:
                assert property_matches_rule(prop, criteria_too_strict, bmv).matches is False

    def test_city_match_is_case_insensitive(self) -> None:
        prop = make_property(city="paris")
        criteria = AlertCriteria(city="PARIS")
        assert property_matches_rule(prop, criteria, bmv=None).matches is True


class TestEvaluateAlertRule:
    def test_inactive_rule_never_triggers(self) -> None:
        rule = make_rule(is_active=False, criteria=AlertCriteria(max_price=1_000_000))
        prop = make_property(listing_price=1_000)
        result, _ = evaluate_alert_rule(rule, [(prop, None)], previous_states={})
        assert result.notifications == []
        assert result.matched_property_ids == []

    def test_new_match_triggers_notification(self) -> None:
        rule = make_rule(criteria=AlertCriteria(max_price=1_000_000))
        prop = make_property(listing_price=1_000)
        result, states = evaluate_alert_rule(rule, [(prop, None)], previous_states={})
        assert result.matched_property_ids == ["p1"]
        assert len(result.notifications) == 1
        assert result.notifications[0].event_type == "new_match"
        assert states["p1"].matched is True

    def test_duplicate_unchanged_match_does_not_renotify(self) -> None:
        rule = make_rule(criteria=AlertCriteria(max_price=1_000_000))
        prop = make_property(listing_price=1_000)
        previous = {
            "p1": MatchState(
                property_id="p1",
                matched=True,
                listing_price=1_000,
                estimated_discount_percentage=None,
                is_bmv=False,
                evaluated_at=datetime.now(UTC),
            )
        }
        result, _ = evaluate_alert_rule(rule, [(prop, None)], previous_states=previous)
        assert result.notifications == []
        assert result.matched_property_ids == ["p1"]

    def test_price_drop_causes_previously_unmatched_to_match(self) -> None:
        rule = make_rule(criteria=AlertCriteria(max_price=100_000))
        previous = {
            "p1": MatchState(
                property_id="p1",
                matched=False,
                listing_price=150_000,
                estimated_discount_percentage=None,
                is_bmv=False,
                evaluated_at=datetime.now(UTC),
            )
        }
        prop = make_property(listing_price=90_000)  # price dropped below max_price
        result, states = evaluate_alert_rule(rule, [(prop, None)], previous_states=previous)
        assert result.matched_property_ids == ["p1"]
        assert result.notifications[0].event_type == "new_match"
        assert states["p1"].matched is True

    def test_material_price_change_on_still_matching_property_renotifies(self) -> None:
        rule = make_rule(criteria=AlertCriteria(max_price=1_000_000))
        previous = {
            "p1": MatchState(
                property_id="p1",
                matched=True,
                listing_price=200_000,
                estimated_discount_percentage=None,
                is_bmv=False,
                evaluated_at=datetime.now(UTC),
            )
        }
        prop = make_property(listing_price=150_000)  # still matches, but price changed
        result, _ = evaluate_alert_rule(rule, [(prop, None)], previous_states=previous)
        assert result.notifications[0].event_type == "material_change"

    def test_property_that_stops_matching_triggers_notification(self) -> None:
        rule = make_rule(criteria=AlertCriteria(max_price=100_000))
        previous = {
            "p1": MatchState(
                property_id="p1",
                matched=True,
                listing_price=90_000,
                estimated_discount_percentage=None,
                is_bmv=False,
                evaluated_at=datetime.now(UTC),
            )
        }
        prop = make_property(listing_price=200_000)  # price rose above max_price
        result, states = evaluate_alert_rule(rule, [(prop, None)], previous_states=previous)
        assert result.matched_property_ids == []
        assert result.notifications[0].event_type == "no_longer_matches"
        assert states["p1"].matched is False

    def test_still_unmatched_property_produces_no_notification(self) -> None:
        rule = make_rule(criteria=AlertCriteria(max_price=100_000))
        previous = {
            "p1": MatchState(
                property_id="p1",
                matched=False,
                listing_price=200_000,
                estimated_discount_percentage=None,
                is_bmv=False,
                evaluated_at=datetime.now(UTC),
            )
        }
        prop = make_property(listing_price=250_000)
        result, _ = evaluate_alert_rule(rule, [(prop, None)], previous_states=previous)
        assert result.notifications == []
        assert result.matched_property_ids == []
