"""Prompt construction and response parsing for the investor strategy agent.

Kept separate from `app/services/dealing_portfolio.py` per the task's requested
separation between "Mistral prompt generation and response parsing" and the
service that orchestrates the call. All validation of model output happens
here via Pydantic — nothing downstream trusts raw model text.
"""

import json

from pydantic import ValidationError

from app.agents.base.prompts import load_prompt
from app.schemas.investor import InvestorProfile, PortfolioStrategy


class InvalidAgentOutputError(Exception):
    """Raised when the model's response cannot be validated as a PortfolioStrategy."""


def build_strategy_messages(profile: InvestorProfile) -> list[dict[str, str]]:
    system_prompt = load_prompt("investor/strategy_system.md")
    user_payload = {
        "investor_profile": profile.model_dump(mode="json"),
    }
    return [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": (
                "Investor profile (JSON). Fields set to null were not supplied by "
                "the investor; treat them as missing, not as zero:\n"
                f"{json.dumps(user_payload, indent=2)}"
            ),
        },
    ]


def parse_strategy_response(raw_text: str) -> PortfolioStrategy:
    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise InvalidAgentOutputError(f"response was not valid JSON: {exc}") from exc

    if not isinstance(payload, dict):
        raise InvalidAgentOutputError("response JSON was not an object")

    try:
        return PortfolioStrategy.model_validate(payload)
    except ValidationError as exc:
        raise InvalidAgentOutputError(
            f"response JSON did not match the expected shape: {exc}"
        ) from exc
