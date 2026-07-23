"""Strategy-generation tests. No live Mistral call: the client is a stub/mock."""

from types import SimpleNamespace
from typing import Any

import httpx
from mistralai.client.errors import SDKError

from app.schemas.investor import InvestorProfile
from app.services.dealing_portfolio import build_fallback_strategy, generate_portfolio_strategy

VALID_STRATEGY_JSON = """
{
  "strategy_name": "Balanced buy-to-let",
  "strategy_pattern": "long_term_buy_to_let",
  "summary": "A balanced approach mixing income and appreciation.",
  "rationale": "Matches the investor's balanced risk tolerance and stated budget.",
  "suggested_allocation": [
    {"category": "Buy-to-let", "target_percentage": 60, "note": null},
    {"category": "Cash buffer", "target_percentage": 40, "note": null}
  ],
  "target_property_characteristics": ["2-3 bedroom apartments", "Near public transit"],
  "expected_advantages": ["Steady rental income"],
  "key_risks": ["Market downturns can reduce property value"],
  "suggested_horizon_years": 10,
  "search_criteria": {
    "cities": ["Paris"], "property_types": ["apartment"],
    "max_price": 300000, "min_expected_yield_pct": 4
  },
  "assumptions": ["Assumed a 10 year horizon since none was given"],
  "limitations": ["Not a certified financial recommendation"]
}
"""


def make_profile(**overrides: object) -> InvestorProfile:
    defaults: dict[str, object] = {"available_budget": 300_000.0}
    defaults.update(overrides)
    return InvestorProfile.model_validate(defaults)


def make_client(content: str | None, *, raise_exc: Exception | None = None) -> Any:
    async def complete_async(**_kwargs: object) -> object:
        if raise_exc is not None:
            raise raise_exc
        message = SimpleNamespace(content=content)
        choice = SimpleNamespace(message=message)
        return SimpleNamespace(choices=[choice])

    return SimpleNamespace(chat=SimpleNamespace(complete_async=complete_async))


class TestBuildFallbackStrategy:
    def test_missing_optional_data_is_handled_safely(self) -> None:
        profile = make_profile()  # only budget supplied
        strategy = build_fallback_strategy(profile)
        assert strategy.assumptions  # must disclose the defaults it assumed

    def test_never_guarantees_returns(self) -> None:
        profile = make_profile(risk_tolerance="aggressive")
        strategy = build_fallback_strategy(profile)
        full_text = " ".join(
            [strategy.summary, strategy.rationale, *strategy.assumptions, *strategy.key_risks]
        ).lower()
        # Only cautious/negated phrasing ("no guarantee", "not guaranteed") is allowed.
        for phrase in ("will return", "guaranteed return", "risk-free", "we guarantee"):
            assert phrase not in full_text

    def test_includes_assumptions_and_risks(self) -> None:
        strategy = build_fallback_strategy(make_profile())
        assert strategy.assumptions
        assert strategy.key_risks


class TestGeneratePortfolioStrategy:
    async def test_valid_mistral_output_is_used(self) -> None:
        client = make_client(VALID_STRATEGY_JSON)
        response = await generate_portfolio_strategy(make_profile(), client, model="test-model")
        assert response.generated_by == "mistral"
        assert response.strategy.strategy_name == "Balanced buy-to-let"

    async def test_invalid_json_falls_back(self) -> None:
        client = make_client("not json at all")
        response = await generate_portfolio_strategy(make_profile(), client, model="test-model")
        assert response.generated_by == "fallback"
        assert response.generation_notes

    async def test_missing_required_field_falls_back(self) -> None:
        client = make_client('{"strategy_name": "incomplete"}')
        response = await generate_portfolio_strategy(make_profile(), client, model="test-model")
        assert response.generated_by == "fallback"

    async def test_empty_response_falls_back(self) -> None:
        client = make_client(None)
        response = await generate_portfolio_strategy(make_profile(), client, model="test-model")
        assert response.generated_by == "fallback"
        assert "Empty response" in response.generation_notes[0]

    async def test_provider_error_falls_back(self) -> None:
        raw_response = httpx.Response(500, request=httpx.Request("POST", "http://test"))
        client = make_client(None, raise_exc=SDKError("boom", raw_response))
        response = await generate_portfolio_strategy(make_profile(), client, model="test-model")
        assert response.generated_by == "fallback"

    async def test_unexpected_exception_falls_back(self) -> None:
        client = make_client(None, raise_exc=TimeoutError("timed out"))
        response = await generate_portfolio_strategy(make_profile(), client, model="test-model")
        assert response.generated_by == "fallback"

    async def test_fallback_never_guarantees_returns(self) -> None:
        client = make_client("garbage")
        response = await generate_portfolio_strategy(make_profile(), client, model="test-model")
        full_text = " ".join(
            [response.strategy.summary, response.strategy.rationale, *response.strategy.key_risks]
        ).lower()
        for phrase in ("will return", "guaranteed return", "risk-free", "we guarantee"):
            assert phrase not in full_text
