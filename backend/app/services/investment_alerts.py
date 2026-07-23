"""Alert-rule matching and evaluation — deterministic, no LLM involved.

Three distinct concepts, kept as three distinct shapes (per task spec):

1. `AlertRule` (schemas/investor.py) — what the investor saved.
2. `property_matches_rule` — evaluating one property against one rule, right now.
3. `evaluate_alert_rule` / `run_alert_evaluation` — a full pass that also
   compares against the *previous* evaluation to avoid re-notifying on an
   unchanged match, and to catch a property that stops matching.

No scheduler is introduced. `run_alert_evaluation` is the callable, testable
entry point a future worker/cron/admin-endpoint/property-update hook is meant
to call — see module docstring in `app/services/investor_ports.py` for the
persistence boundary this composes against.
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.investor import (
    AlertCriteria,
    AlertEvaluationResult,
    AlertRule,
    BMVResult,
    MatchState,
    NotificationEventType,
    PropertySnapshot,
    TriggeredNotification,
    risk_level_rank,
)
from app.services.investor_ports import (
    AlertRuleRepository,
    NotificationPublisher,
    NotificationRepository,
)


@dataclass
class MatchOutcome:
    property_id: str
    matches: bool
    failed_criteria: list[str] = field(default_factory=list)


def property_matches_rule(
    prop: PropertySnapshot,
    criteria: AlertCriteria,
    bmv: BMVResult | None,
) -> MatchOutcome:
    """Pure predicate: does this property satisfy this rule's criteria right now?

    Every criteria field is optional and applied independently — an unset field
    never excludes a property.
    """
    failed: list[str] = []

    if criteria.city is not None and (prop.city or "").casefold() != criteria.city.casefold():
        failed.append("city")

    if (
        criteria.property_type is not None
        and (prop.property_type or "").casefold() != criteria.property_type.casefold()
    ):
        failed.append("property_type")

    if (
        criteria.transaction_type is not None
        and (prop.transaction_type or "").casefold() != criteria.transaction_type.casefold()
    ):
        failed.append("transaction_type")

    if criteria.max_price is not None and prop.listing_price > criteria.max_price:
        failed.append("max_price")

    if criteria.min_discount_percentage is not None:
        discount = bmv.estimated_discount_percentage if bmv is not None else None
        if discount is None or discount < criteria.min_discount_percentage:
            failed.append("min_discount_percentage")

    if criteria.min_expected_yield_pct is not None and (
        prop.expected_yield_pct is None or prop.expected_yield_pct < criteria.min_expected_yield_pct
    ):
        failed.append("min_expected_yield_pct")

    if criteria.max_risk_level is not None and (
        bmv is None or risk_level_rank(bmv.risk_level) > risk_level_rank(criteria.max_risk_level)
    ):
        failed.append("max_risk_level")

    return MatchOutcome(property_id=prop.property_id, matches=not failed, failed_criteria=failed)


def _material_change(previous: MatchState, prop: PropertySnapshot, bmv: BMVResult | None) -> bool:
    """A previously-matched, still-matching property re-notifies only on real change."""
    if previous.listing_price != prop.listing_price:
        return True
    current_discount = bmv.estimated_discount_percentage if bmv is not None else None
    if previous.estimated_discount_percentage != current_discount:
        return True
    current_is_bmv = bmv.is_bmv if bmv is not None else False
    return previous.is_bmv != current_is_bmv


def evaluate_alert_rule(
    rule: AlertRule,
    candidates: list[tuple[PropertySnapshot, BMVResult | None]],
    previous_states: dict[str, MatchState],
) -> tuple[AlertEvaluationResult, dict[str, MatchState]]:
    """One deterministic evaluation pass. Returns the result plus the new state
    snapshot the caller should persist for the next pass's dedup comparison."""
    now = datetime.now(UTC)

    if not rule.is_active:
        return (
            AlertEvaluationResult(
                rule_id=rule.id, evaluated_at=now, matched_property_ids=[], notifications=[]
            ),
            previous_states,
        )

    matched_ids: list[str] = []
    notifications: list[TriggeredNotification] = []
    new_states: dict[str, MatchState] = {}

    seen_ids = set()
    for prop, bmv in candidates:
        seen_ids.add(prop.property_id)
        outcome = property_matches_rule(prop, rule.criteria, bmv)
        previous = previous_states.get(prop.property_id)

        if outcome.matches:
            matched_ids.append(prop.property_id)

        event_type: NotificationEventType | None = None
        reason = ""
        if outcome.matches and (previous is None or not previous.matched):
            event_type = "new_match"
            reason = "Property newly matches the alert criteria."
        elif outcome.matches and previous is not None and previous.matched:
            if _material_change(previous, prop, bmv):
                event_type = "material_change"
                reason = "Property still matches, but price or valuation changed materially."
        elif not outcome.matches and previous is not None and previous.matched:
            event_type = "no_longer_matches"
            reason = f"Property no longer matches: {', '.join(outcome.failed_criteria)}."

        if event_type is not None:
            notifications.append(
                TriggeredNotification(
                    id=str(uuid4()),
                    investor_id=rule.investor_id,
                    rule_id=rule.id,
                    property_id=prop.property_id,
                    event_type=event_type,
                    reason=reason,
                    triggered_at=now,
                )
            )

        new_states[prop.property_id] = MatchState(
            property_id=prop.property_id,
            matched=outcome.matches,
            listing_price=prop.listing_price,
            estimated_discount_percentage=(
                bmv.estimated_discount_percentage if bmv is not None else None
            ),
            is_bmv=bmv.is_bmv if bmv is not None else False,
            evaluated_at=now,
        )

    # Properties matched last time but absent from this candidate batch are left
    # untouched rather than treated as "no longer matches": their absence here
    # means "not evaluated this pass" (e.g. outside the search page), not
    # necessarily "disqualified". Carry their prior state forward unchanged.
    for property_id, previous in previous_states.items():
        if property_id not in seen_ids:
            new_states[property_id] = previous

    result = AlertEvaluationResult(
        rule_id=rule.id,
        evaluated_at=now,
        matched_property_ids=matched_ids,
        notifications=notifications,
    )
    return result, new_states


async def run_alert_evaluation(
    investor_id: str,
    rule_id: str,
    candidates: list[tuple[PropertySnapshot, BMVResult | None]],
    *,
    alert_rule_repo: AlertRuleRepository,
    notification_repo: NotificationRepository,
    notification_publisher: NotificationPublisher,
) -> AlertEvaluationResult:
    """The composed, callable service: fetch rule + prior state, evaluate,
    persist new state and notifications, publish live. This is the integration
    point a future scheduler/worker/admin-endpoint/property-update hook calls —
    none of those exist yet, and none is introduced here (see task boundary)."""
    rule = await alert_rule_repo.get(investor_id, rule_id)
    previous_states = await notification_repo.get_last_states(rule_id)

    result, new_states = evaluate_alert_rule(rule, candidates, previous_states)

    await notification_repo.save_states(rule_id, new_states)
    for notification in result.notifications:
        await notification_repo.record(notification)
        await notification_publisher.publish(notification)

    return result
