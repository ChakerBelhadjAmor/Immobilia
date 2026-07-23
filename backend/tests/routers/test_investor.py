"""Investor router tests: auth, ownership, validation, dependency failure, and
cross-request persistence of the default in-memory repositories.

Mistral is always a stub here — no live provider call. The real property
valuation service doesn't exist yet, so most tests inject a fake
`PropertyValuationRepository`; a couple of tests deliberately leave it
unoverridden to prove the production default fails loudly instead of
fabricating valuation data.
"""

from collections.abc import Generator
from types import SimpleNamespace
from typing import Any
from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.agents.base.client import get_mistral
from app.core.security import create_access_token
from app.main import app
from app.schemas.investor import AlertEvaluationRequest, BMVRankingRequest, PropertySnapshot
from app.services.investor_ports import (
    InMemoryAlertRuleRepository,
    InMemoryNotificationRepository,
    get_alert_rule_repository,
    get_notification_publisher,
    get_notification_repository,
    get_property_valuation_repository,
)

# Fixed, server-side "trusted" catalog used by the default fake valuation repo.
# "cheap" is a genuine BMV (20% below its estimated market value); "fair" is not.
_PROPERTY_CATALOG: dict[str, PropertySnapshot] = {
    "cheap": PropertySnapshot(
        property_id="cheap", listing_price=80_000, estimated_market_value=100_000, city="Paris"
    ),
    "fair": PropertySnapshot(
        property_id="fair", listing_price=100_000, estimated_market_value=100_000, city="Paris"
    ),
}


class _FakePropertyValuationRepository:
    def __init__(self, catalog: dict[str, PropertySnapshot]) -> None:
        self._catalog = catalog

    async def get_by_ids(self, property_ids: list[str]) -> list[PropertySnapshot]:
        return [self._catalog[pid] for pid in property_ids if pid in self._catalog]


class _NullPublisher:
    async def publish(self, notification: object) -> None:
        return None


def _fake_mistral(content: str | None) -> Any:
    async def complete_async(**_kwargs: object) -> object:
        message = SimpleNamespace(content=content)
        choice = SimpleNamespace(message=message)
        return SimpleNamespace(choices=[choice])

    return SimpleNamespace(chat=SimpleNamespace(complete_async=complete_async))


@pytest.fixture(autouse=True)
def _isolated_investor_dependencies() -> Generator[None]:
    """One shared in-memory repo instance per test (not per call), a stub
    Mistral client, and a fake, non-durable valuation catalog — all as
    dependency overrides so the *real* production singletons (asserted on
    directly by the persistence tests below) are never touched by default."""
    alert_rule_repo = InMemoryAlertRuleRepository()
    notification_repo = InMemoryNotificationRepository()
    publisher = _NullPublisher()
    valuation_repo = _FakePropertyValuationRepository(_PROPERTY_CATALOG)

    app.dependency_overrides[get_alert_rule_repository] = lambda: alert_rule_repo
    app.dependency_overrides[get_notification_repository] = lambda: notification_repo
    app.dependency_overrides[get_notification_publisher] = lambda: publisher
    app.dependency_overrides[get_property_valuation_repository] = lambda: valuation_repo
    app.dependency_overrides[get_mistral] = lambda: _fake_mistral(None)
    yield
    app.dependency_overrides.clear()


def auth_headers(investor_id: str = "investor-1") -> dict[str, str]:
    token = create_access_token(subject=investor_id)
    return {"Authorization": f"Bearer {token}"}


class TestAuth:
    async def test_missing_token_is_unauthorized(self, client: AsyncClient) -> None:
        resp = await client.get("/investor/alerts")
        assert resp.status_code == 401

    async def test_invalid_token_is_unauthorized(self, client: AsyncClient) -> None:
        resp = await client.get(
            "/investor/alerts", headers={"Authorization": "Bearer not-a-real-token"}
        )
        assert resp.status_code == 401

    async def test_valid_token_is_authorized(self, client: AsyncClient) -> None:
        resp = await client.get("/investor/alerts", headers=auth_headers())
        assert resp.status_code == 200


class TestStrategyEndpoint:
    async def test_successful_request(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/investor/strategy",
            headers=auth_headers(),
            json={"investor_profile": {"available_budget": 250000}},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["generated_by"] == "fallback"  # stub client returns no content
        assert "guaranteed" not in body["strategy"]["summary"].lower()

    async def test_validation_failure_on_missing_budget(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/investor/strategy", headers=auth_headers(), json={"investor_profile": {}}
        )
        assert resp.status_code == 422

    async def test_mistral_provider_failure_degrades_to_fallback(self, client: AsyncClient) -> None:
        async def raise_error(**_kwargs: object) -> object:
            raise RuntimeError("provider unavailable")

        app.dependency_overrides[get_mistral] = lambda: SimpleNamespace(
            chat=SimpleNamespace(complete_async=raise_error)
        )
        resp = await client.post(
            "/investor/strategy",
            headers=auth_headers(),
            json={"investor_profile": {"available_budget": 100000}},
        )
        assert resp.status_code == 200
        assert resp.json()["generated_by"] == "fallback"


class TestBmvEndpoint:
    async def test_successful_ranking_uses_server_side_valuation(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/investor/bmv/rank",
            headers=auth_headers(),
            json={"property_ids": ["cheap", "fair"]},
        )
        assert resp.status_code == 200
        results = {r["property_id"]: r for r in resp.json()["results"]}
        assert results["cheap"]["is_bmv"] is True
        assert results["cheap"]["estimated_market_value"] == 100_000  # from the trusted catalog
        assert results["fair"]["is_bmv"] is False

    async def test_unknown_property_id_is_silently_omitted(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/investor/bmv/rank",
            headers=auth_headers(),
            json={"property_ids": ["does-not-exist"]},
        )
        assert resp.status_code == 200
        assert resp.json()["results"] == []

    async def test_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post("/investor/bmv/rank", json={"property_ids": []})
        assert resp.status_code == 401

    async def test_client_cannot_submit_valuation_fields(self, client: AsyncClient) -> None:
        """The request schema has no field for it, and extra="forbid" rejects
        any attempt to smuggle one in — proven both ways below."""
        assert "estimated_market_value" not in BMVRankingRequest.model_fields

        resp = await client.post(
            "/investor/bmv/rank",
            headers=auth_headers(),
            json={"property_ids": ["cheap"], "estimated_market_value": 5},
        )
        assert resp.status_code == 422

    async def test_valuation_service_unavailable_returns_503_not_fake_data(
        self, client: AsyncClient
    ) -> None:
        """With no override, the real production adapter must fail loudly —
        never invent a valuation to keep the endpoint looking functional."""
        del app.dependency_overrides[get_property_valuation_repository]
        resp = await client.post(
            "/investor/bmv/rank", headers=auth_headers(), json={"property_ids": ["cheap"]}
        )
        assert resp.status_code == 503


class TestAlertRulesEndpoints:
    async def test_create_and_get_own_rule(self, client: AsyncClient) -> None:
        create_resp = await client.post(
            "/investor/alerts",
            headers=auth_headers("investor-1"),
            json={"name": "Paris deals", "criteria": {"city": "Paris"}},
        )
        assert create_resp.status_code == 201
        rule_id = create_resp.json()["id"]

        get_resp = await client.get(
            f"/investor/alerts/{rule_id}", headers=auth_headers("investor-1")
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["name"] == "Paris deals"

    async def test_cannot_access_another_investors_rule(self, client: AsyncClient) -> None:
        create_resp = await client.post(
            "/investor/alerts",
            headers=auth_headers("investor-1"),
            json={"name": "Paris deals", "criteria": {}},
        )
        rule_id = create_resp.json()["id"]

        resp = await client.get(f"/investor/alerts/{rule_id}", headers=auth_headers("investor-2"))
        assert resp.status_code == 404

    async def test_get_nonexistent_rule_is_404(self, client: AsyncClient) -> None:
        resp = await client.get("/investor/alerts/does-not-exist", headers=auth_headers())
        assert resp.status_code == 404

    async def test_update_deactivates_rule(self, client: AsyncClient) -> None:
        create_resp = await client.post(
            "/investor/alerts",
            headers=auth_headers(),
            json={"name": "Deals", "criteria": {}},
        )
        rule_id = create_resp.json()["id"]

        patch_resp = await client.patch(
            f"/investor/alerts/{rule_id}", headers=auth_headers(), json={"is_active": False}
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["is_active"] is False

    async def test_list_only_returns_own_rules(self, client: AsyncClient) -> None:
        await client.post(
            "/investor/alerts",
            headers=auth_headers("investor-1"),
            json={"name": "A", "criteria": {}},
        )
        await client.post(
            "/investor/alerts",
            headers=auth_headers("investor-2"),
            json={"name": "B", "criteria": {}},
        )
        resp = await client.get("/investor/alerts", headers=auth_headers("investor-1"))
        names = [r["name"] for r in resp.json()]
        assert names == ["A"]


class TestAlertEvaluationEndpoint:
    async def test_evaluate_creates_notification_and_dedupes_on_replay(
        self, client: AsyncClient
    ) -> None:
        create_resp = await client.post(
            "/investor/alerts",
            headers=auth_headers(),
            json={"name": "Cheap Paris", "criteria": {"city": "Paris", "max_price": 200000}},
        )
        rule_id = create_resp.json()["id"]
        payload = {"candidate_property_ids": ["cheap"]}

        first = await client.post(
            f"/investor/alerts/{rule_id}/evaluate", headers=auth_headers(), json=payload
        )
        assert first.status_code == 200
        assert len(first.json()["notifications"]) == 1
        assert first.json()["notifications"][0]["event_type"] == "new_match"

        second = await client.post(
            f"/investor/alerts/{rule_id}/evaluate", headers=auth_headers(), json=payload
        )
        assert second.json()["notifications"] == []  # unchanged match, no duplicate notification

    async def test_evaluate_unknown_rule_is_404(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/investor/alerts/does-not-exist/evaluate",
            headers=auth_headers(),
            json={"candidate_property_ids": []},
        )
        assert resp.status_code == 404

    async def test_client_cannot_submit_valuation_fields(self, client: AsyncClient) -> None:
        assert "estimated_market_value" not in AlertEvaluationRequest.model_fields

        create_resp = await client.post(
            "/investor/alerts", headers=auth_headers(), json={"name": "Any", "criteria": {}}
        )
        rule_id = create_resp.json()["id"]

        resp = await client.post(
            f"/investor/alerts/{rule_id}/evaluate",
            headers=auth_headers(),
            json={"candidate_property_ids": ["cheap"], "estimated_market_value": 1},
        )
        assert resp.status_code == 422


class TestNotificationsEndpoint:
    async def test_list_notifications_after_evaluation(self, client: AsyncClient) -> None:
        create_resp = await client.post(
            "/investor/alerts",
            headers=auth_headers(),
            json={"name": "Any", "criteria": {}},
        )
        rule_id = create_resp.json()["id"]
        await client.post(
            f"/investor/alerts/{rule_id}/evaluate",
            headers=auth_headers(),
            json={"candidate_property_ids": ["cheap"]},
        )

        resp = await client.get("/investor/notifications", headers=auth_headers())
        assert resp.status_code == 200
        assert len(resp.json()) == 1


class TestRealSingletonPersistsAcrossRequests:
    """These deliberately remove the per-test override for the alert/notification
    repos so the endpoints hit the *actual* production singletons from
    `app.services.investor_ports`, proving they are shared for the process
    lifetime rather than re-created per request. Each test uses a unique
    investor id so it can't collide with any other test in this module."""

    async def test_alert_rule_persists_across_separate_requests(self, client: AsyncClient) -> None:
        del app.dependency_overrides[get_alert_rule_repository]
        investor_id = f"investor-{uuid4()}"

        create_resp = await client.post(
            "/investor/alerts",
            headers=auth_headers(investor_id),
            json={"name": "Persisted rule", "criteria": {}},
        )
        assert create_resp.status_code == 201
        rule_id = create_resp.json()["id"]

        # A genuinely separate request/response cycle against the ASGI app.
        get_resp = await client.get(
            f"/investor/alerts/{rule_id}", headers=auth_headers(investor_id)
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["name"] == "Persisted rule"

    async def test_notification_persists_across_separate_requests(
        self, client: AsyncClient
    ) -> None:
        del app.dependency_overrides[get_alert_rule_repository]
        del app.dependency_overrides[get_notification_repository]
        investor_id = f"investor-{uuid4()}"

        create_resp = await client.post(
            "/investor/alerts",
            headers=auth_headers(investor_id),
            json={"name": "Cheap Paris", "criteria": {"max_price": 200000}},
        )
        rule_id = create_resp.json()["id"]

        eval_resp = await client.post(
            f"/investor/alerts/{rule_id}/evaluate",
            headers=auth_headers(investor_id),
            json={"candidate_property_ids": ["cheap"]},
        )
        assert eval_resp.status_code == 200
        assert len(eval_resp.json()["notifications"]) == 1

        # A later, separate request.
        list_resp = await client.get("/investor/notifications", headers=auth_headers(investor_id))
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

    async def test_investor_isolation_holds_on_the_real_singleton(
        self, client: AsyncClient
    ) -> None:
        del app.dependency_overrides[get_alert_rule_repository]
        del app.dependency_overrides[get_notification_repository]
        investor_a = f"investor-{uuid4()}"
        investor_b = f"investor-{uuid4()}"

        create_resp = await client.post(
            "/investor/alerts",
            headers=auth_headers(investor_a),
            json={"name": "A's rule", "criteria": {"max_price": 200000}},
        )
        rule_id = create_resp.json()["id"]
        await client.post(
            f"/investor/alerts/{rule_id}/evaluate",
            headers=auth_headers(investor_a),
            json={"candidate_property_ids": ["cheap"]},
        )

        forbidden = await client.get(
            f"/investor/alerts/{rule_id}", headers=auth_headers(investor_b)
        )
        assert forbidden.status_code == 404

        b_notifications = await client.get(
            "/investor/notifications", headers=auth_headers(investor_b)
        )
        assert b_notifications.json() == []

        a_notifications = await client.get(
            "/investor/notifications", headers=auth_headers(investor_a)
        )
        assert len(a_notifications.json()) == 1
