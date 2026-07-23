"""Agent-protocol adapter for portfolio strategy generation.

Conforms to `app.agents.base.orchestrator.Agent` so this capability can be
driven by a future orchestrator without change, once one is chosen (deliberately
undecided per CLAUDE.md). Business logic lives in
`app.services.dealing_portfolio`; this class only adapts the generic
`run(context) -> dict` shape to it.
"""

from typing import Any

from app.agents.base.client import get_mistral
from app.core.config import get_settings
from app.schemas.investor import InvestorProfile
from app.services.dealing_portfolio import generate_portfolio_strategy


class DealingPortfolioAgent:
    name = "investor.dealing_portfolio"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        profile = InvestorProfile.model_validate(context["investor_profile"])
        settings = get_settings()
        response = await generate_portfolio_strategy(
            profile, get_mistral(), model=settings.mistral_model
        )
        return response.model_dump(mode="json")
