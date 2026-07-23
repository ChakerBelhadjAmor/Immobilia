"""Seller Agent 1 — voice listing-intake assistant.

Implements the `Agent` Protocol (`app.agents.base.orchestrator`). Given a speech
transcript it asks Mistral for a structured listing extraction, the list of missing
required fields, and follow-up questions. Pure LLM step — no DB access, no photos,
no AI scoring (Agents 2/5 own those). The service layer handles human-in-the-loop
confirmation and persistence.
"""

import json
from typing import Any

from app.agents.base.client import get_mistral
from app.agents.base.prompts import load_prompt
from app.schemas.listing import ListingIntakeResponse

_MODEL = "mistral-large-latest"
_PROMPT = "seller/listing_intake.md"


def _build_user_message(transcript: str, partial: dict[str, Any]) -> str:
    parts = [f"Transcript:\n{transcript.strip()}"]
    if partial:
        parts.append(
            "Fields the seller has already confirmed (treat as authoritative, keep them):\n"
            + json.dumps(partial, ensure_ascii=False)
        )
    return "\n\n".join(parts)


class ListingAssistantAgent:
    name: str = "seller.listing_assistant"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        transcript: str = context.get("transcript", "") or ""
        partial: dict[str, Any] = context.get("partial") or {}

        # SDK typing wants concrete message models; plain role/content dicts work at
        # runtime, so widen to Any rather than import the SDK's TypedDict zoo.
        messages: Any = [
            {"role": "system", "content": load_prompt(_PROMPT)},
            {"role": "user", "content": _build_user_message(transcript, partial)},
        ]
        client = get_mistral()
        response = await client.chat.complete_async(
            model=_MODEL,
            messages=messages,
            response_format={"type": "json_object"},
        )

        choices = response.choices or []
        message = choices[0].message if choices else None
        content = message.content if message else None
        if not isinstance(content, str):
            raise ValueError("Mistral returned a non-text response")
        data: dict[str, Any] = json.loads(content)

        result = ListingIntakeResponse(
            extracted={**(data.get("extracted") or {}), **partial},
            missing_fields=list(data.get("missing_fields") or []),
            questions=list(data.get("questions") or []),
        )
        return result.model_dump()
