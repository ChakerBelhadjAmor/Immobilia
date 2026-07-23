"""Persistence and delivery seams for the investor alert system.

Three of these ports have no durable/real production adapter yet, by design:

* `AlertRuleRepository` — there is no `alert_rules` table in the documented
  schema (CLAUDE.md §"Investor module" lists only `investment_reports`,
  `risk_factors`, `what_if_scenarios`). Inventing one here would risk
  colliding with whoever eventually owns that migration.
* `NotificationRepository` — `notifications` *is* a named table (messaging
  group) but no column list is documented anywhere available to this task, and
  `app/models/messaging.py` is owned by the messaging domain, not this agent.
* `PropertyValuationRepository` — trusted listing prices and AI valuation
  fields (`estimated_market_value`, mirroring `properties.ai_price_estimate`)
  must come from an internal property/valuation service, never from a public
  request body (see `app/schemas/investor.py::BMVRankingRequest` /
  `AlertEvaluationRequest`, which only accept property ids). That service does
  not exist yet (the `properties` table is a placeholder), so the production
  adapter here raises `PropertyRepositoryUnavailableError` rather than
  returning fabricated valuation data — an honest failure, not fake success.

The two alert ports get an in-memory adapter wired as the default today
(process lifetime only, not durable — stated at every call site that
matters). Each getter below is a **module-level singleton, built once and
reused for the life of the process** — the same lazy-singleton shape as
`app.core.redis.get_redis` / `app.agents.base.client.get_mistral` — so state
created in one request (e.g. a saved alert rule) is visible in the next.
Swapping in a real SQLAlchemy-backed implementation once those tables land is
a drop-in change: only the getters below need to change, nothing in
`app/services/investment_alerts.py` or the router. FastAPI's
`app.dependency_overrides` still overrides these getters cleanly in tests.

`NotificationPublisher`'s Redis adapter *is* wired for real: `notif:{user_id}`
pub/sub is a documented Redis key shape (CLAUDE.md §4) and `app.core.redis`
already provides the client.
"""

from datetime import UTC, datetime
from typing import Protocol
from uuid import uuid4

from app.core.redis import get_redis
from app.schemas.investor import (
    AlertRule,
    AlertRuleCreate,
    AlertRuleUpdate,
    MatchState,
    PropertySnapshot,
    TriggeredNotification,
)


class AlertRuleNotFoundError(Exception):
    pass


class PropertyRepositoryUnavailableError(Exception):
    """Raised instead of ever returning fabricated valuation data."""


class AlertRuleRepository(Protocol):
    async def create(self, investor_id: str, payload: AlertRuleCreate) -> AlertRule: ...

    async def get(self, investor_id: str, rule_id: str) -> AlertRule: ...

    async def list_for_investor(self, investor_id: str) -> list[AlertRule]: ...

    async def update(
        self, investor_id: str, rule_id: str, payload: AlertRuleUpdate
    ) -> AlertRule: ...


class NotificationRepository(Protocol):
    async def get_last_states(self, rule_id: str) -> dict[str, MatchState]: ...

    async def save_states(self, rule_id: str, states: dict[str, MatchState]) -> None: ...

    async def record(self, notification: TriggeredNotification) -> None: ...

    async def list_for_investor(self, investor_id: str) -> list[TriggeredNotification]: ...


class NotificationPublisher(Protocol):
    async def publish(self, notification: TriggeredNotification) -> None: ...


class PropertyValuationRepository(Protocol):
    """The only source of trusted property facts and valuation estimates.

    Callers pass property ids (never client-supplied prices/valuations); this
    looks them up server-side. `get_by_ids` may return fewer properties than
    were requested (unknown ids are simply omitted).
    """

    async def get_by_ids(self, property_ids: list[str]) -> list[PropertySnapshot]: ...


class InMemoryAlertRuleRepository:
    """Non-durable reference adapter. See module docstring for why."""

    def __init__(self) -> None:
        self._rules: dict[str, AlertRule] = {}

    async def create(self, investor_id: str, payload: AlertRuleCreate) -> AlertRule:
        now = datetime.now(UTC)
        rule = AlertRule(
            id=str(uuid4()),
            investor_id=investor_id,
            name=payload.name,
            criteria=payload.criteria,
            is_active=payload.is_active,
            created_at=now,
            updated_at=now,
        )
        self._rules[rule.id] = rule
        return rule

    async def get(self, investor_id: str, rule_id: str) -> AlertRule:
        rule = self._rules.get(rule_id)
        if rule is None or rule.investor_id != investor_id:
            raise AlertRuleNotFoundError(rule_id)
        return rule

    async def list_for_investor(self, investor_id: str) -> list[AlertRule]:
        return [r for r in self._rules.values() if r.investor_id == investor_id]

    async def update(self, investor_id: str, rule_id: str, payload: AlertRuleUpdate) -> AlertRule:
        rule = await self.get(investor_id, rule_id)
        updated = rule.model_copy(
            update={
                "name": payload.name if payload.name is not None else rule.name,
                "criteria": payload.criteria if payload.criteria is not None else rule.criteria,
                "is_active": (
                    payload.is_active if payload.is_active is not None else rule.is_active
                ),
                "updated_at": datetime.now(UTC),
            }
        )
        self._rules[rule_id] = updated
        return updated


class InMemoryNotificationRepository:
    """Non-durable reference adapter. See module docstring for why."""

    def __init__(self) -> None:
        self._states: dict[str, dict[str, MatchState]] = {}
        self._notifications: dict[str, list[TriggeredNotification]] = {}

    async def get_last_states(self, rule_id: str) -> dict[str, MatchState]:
        return dict(self._states.get(rule_id, {}))

    async def save_states(self, rule_id: str, states: dict[str, MatchState]) -> None:
        self._states[rule_id] = dict(states)

    async def record(self, notification: TriggeredNotification) -> None:
        self._notifications.setdefault(notification.investor_id, []).append(notification)

    async def list_for_investor(self, investor_id: str) -> list[TriggeredNotification]:
        return list(self._notifications.get(investor_id, []))


class RedisNotificationPublisher:
    """Publishes to `notif:{investor_id}`, the documented live-notification channel."""

    async def publish(self, notification: TriggeredNotification) -> None:
        redis = get_redis()
        channel = f"notif:{notification.investor_id}"
        await redis.publish(channel, notification.model_dump_json())


class UnavailablePropertyValuationRepository:
    """Production default until a real property/valuation service exists.

    Fails loudly rather than inventing prices or valuations — see module
    docstring. The router turns this into HTTP 503.
    """

    async def get_by_ids(self, property_ids: list[str]) -> list[PropertySnapshot]:
        raise PropertyRepositoryUnavailableError(
            "No property/valuation service is wired yet; the 'properties' table "
            "is not implemented. Inject a PropertyValuationRepository to use this."
        )


# Lazy, module-level singletons — same shape as app.core.redis.get_redis /
# app.agents.base.client.get_mistral. Built once per process and reused by
# every request, so state (e.g. a saved alert rule) persists across requests
# for the life of the process. `app.dependency_overrides` replaces the getter
# itself in tests, so this laziness does not affect testability.
_alert_rule_repository: AlertRuleRepository | None = None
_notification_repository: NotificationRepository | None = None
_notification_publisher: NotificationPublisher | None = None
_property_valuation_repository: PropertyValuationRepository | None = None


def get_alert_rule_repository() -> AlertRuleRepository:
    global _alert_rule_repository
    if _alert_rule_repository is None:
        _alert_rule_repository = InMemoryAlertRuleRepository()
    return _alert_rule_repository


def get_notification_repository() -> NotificationRepository:
    global _notification_repository
    if _notification_repository is None:
        _notification_repository = InMemoryNotificationRepository()
    return _notification_repository


def get_notification_publisher() -> NotificationPublisher:
    global _notification_publisher
    if _notification_publisher is None:
        _notification_publisher = RedisNotificationPublisher()
    return _notification_publisher


def get_property_valuation_repository() -> PropertyValuationRepository:
    global _property_valuation_repository
    if _property_valuation_repository is None:
        _property_valuation_repository = UnavailablePropertyValuationRepository()
    return _property_valuation_repository
