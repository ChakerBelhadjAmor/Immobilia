"""Portfolio strategy generation — Mistral for the explanation, deterministic
Python for anything that looks like arithmetic or rule matching.

`generate_portfolio_strategy` never raises to its caller: invalid JSON, a
missing field, a provider error, a timeout, or an empty response all fall back
to `build_fallback_strategy`, a deterministic, cautious-by-construction
strategy skeleton. Callers can tell the two apart via
`PortfolioStrategyResponse.generated_by`.
"""

import logging

from mistralai.client import Mistral
from mistralai.client.errors import MistralError
from mistralai.client.models import TextChunk

from app.agents.investor.prompts import (
    InvalidAgentOutputError,
    build_strategy_messages,
    parse_strategy_response,
)
from app.schemas.investor import (
    InvestorProfile,
    PortfolioStrategy,
    PortfolioStrategyResponse,
    RiskTolerance,
    SearchCriteria,
    StrategyPattern,
    SuggestedAllocation,
)

logger = logging.getLogger(__name__)

_FALLBACK_PATTERN_BY_RISK = {
    RiskTolerance.CONSERVATIVE: StrategyPattern.CONSERVATIVE_ALLOCATION,
    RiskTolerance.BALANCED: StrategyPattern.BALANCED_ALLOCATION,
    RiskTolerance.AGGRESSIVE: StrategyPattern.AGGRESSIVE_ALLOCATION,
}

_FALLBACK_ALLOCATION_BY_RISK = {
    RiskTolerance.CONSERVATIVE: [
        SuggestedAllocation(category="Income-focused buy-to-let", target_percentage=70),
        SuggestedAllocation(category="Cash / liquidity buffer", target_percentage=30),
    ],
    RiskTolerance.BALANCED: [
        SuggestedAllocation(category="Buy-to-let (income)", target_percentage=50),
        SuggestedAllocation(category="Value-add / appreciation-focused", target_percentage=30),
        SuggestedAllocation(category="Cash / liquidity buffer", target_percentage=20),
    ],
    RiskTolerance.AGGRESSIVE: [
        SuggestedAllocation(
            category="Value-add renovation / BMV acquisition", target_percentage=60
        ),
        SuggestedAllocation(category="Appreciation-focused growth", target_percentage=30),
        SuggestedAllocation(category="Cash / liquidity buffer", target_percentage=10),
    ],
}


def build_fallback_strategy(profile: InvestorProfile) -> PortfolioStrategy:
    """Deterministic, cautious-by-construction strategy used when the AI
    explanation step is unavailable or returns unusable output."""
    risk = profile.risk_tolerance or RiskTolerance.BALANCED
    assumptions = ["No guarantee of returns is made or implied by this strategy."]
    if profile.risk_tolerance is None:
        assumptions.append(f"No risk tolerance was supplied; assumed '{risk.value}' as a default.")
    if profile.investment_horizon_years is None:
        assumptions.append("No investment horizon was supplied.")

    return PortfolioStrategy(
        strategy_name=f"{risk.value.capitalize()} allocation starting point",
        strategy_pattern=_FALLBACK_PATTERN_BY_RISK[risk],
        summary=(
            "A general-purpose starting point built from established allocation patterns. "
            "It is not a personalized recommendation and was generated without AI assistance."
        ),
        rationale=(
            "Generated deterministically because an AI-explained strategy was unavailable. "
            "Reflects only the stated risk tolerance and budget, not a full profile analysis."
        ),
        suggested_allocation=_FALLBACK_ALLOCATION_BY_RISK[risk],
        target_property_characteristics=[
            "Matches the investor's preferred cities and property types, where provided.",
        ],
        expected_advantages=[
            "Diversifies exposure across allocation categories.",
            "Aligned with the stated risk tolerance.",
        ],
        key_risks=[
            "Real estate markets can decline; capital is at risk.",
            "Rental income and capital appreciation are not guaranteed.",
            "This fallback does not reflect current market conditions.",
        ],
        suggested_horizon_years=profile.investment_horizon_years,
        search_criteria=SearchCriteria(
            cities=profile.preferred_cities,
            property_types=profile.preferred_property_types,
            max_price=profile.available_budget,
            min_expected_yield_pct=profile.target_rental_yield_pct,
        ),
        assumptions=assumptions,
        limitations=[
            "This is a deterministic fallback, not an AI-generated, personalized explanation.",
            "Does not account for real-time market data or the investor's full context.",
        ],
    )


def _extract_text(content: object) -> str | None:
    if isinstance(content, str):
        return content or None
    if isinstance(content, list):
        parts = [chunk.text for chunk in content if isinstance(chunk, TextChunk)]
        text = "".join(parts)
        return text or None
    return None


async def generate_portfolio_strategy(
    profile: InvestorProfile,
    client: Mistral,
    *,
    model: str,
) -> PortfolioStrategyResponse:
    messages = build_strategy_messages(profile)

    try:
        response = await client.chat.complete_async(
            model=model,
            messages=messages,  # type: ignore[arg-type]
            response_format={"type": "json_object"},
        )
    except MistralError as exc:
        logger.warning("Mistral provider error generating portfolio strategy: %s", exc)
        note = f"AI provider error ({exc.__class__.__name__}); used a fallback strategy."
        return PortfolioStrategyResponse(
            strategy=build_fallback_strategy(profile),
            generated_by="fallback",
            generation_notes=[note],
        )
    except Exception as exc:  # noqa: BLE001 - any transport/timeout failure must degrade safely
        logger.warning("Unexpected error calling Mistral: %s", exc)
        note = "Unexpected error calling the AI provider; used a fallback strategy."
        return PortfolioStrategyResponse(
            strategy=build_fallback_strategy(profile),
            generated_by="fallback",
            generation_notes=[note],
        )

    content = None
    if response.choices:
        message = response.choices[0].message
        if message is not None:
            content = _extract_text(message.content)

    if not content:
        return PortfolioStrategyResponse(
            strategy=build_fallback_strategy(profile),
            generated_by="fallback",
            generation_notes=["Empty response from the AI provider; used a fallback strategy."],
        )

    try:
        strategy = parse_strategy_response(content)
    except InvalidAgentOutputError as exc:
        logger.warning("Invalid strategy output from Mistral: %s", exc)
        return PortfolioStrategyResponse(
            strategy=build_fallback_strategy(profile),
            generated_by="fallback",
            generation_notes=[f"AI output failed validation ({exc}); used a fallback strategy."],
        )

    return PortfolioStrategyResponse(strategy=strategy, generated_by="mistral")
