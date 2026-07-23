"""Thin async wrapper around the Mistral SDK (which is itself synchronous)."""
import asyncio
import json
from typing import Any

from app.agents.base.client import get_mistral
from app.core.config import get_settings


async def call_mistral_json(
    system_prompt: str, user_prompt: str, temperature: float = 0.2
) -> dict[str, Any]:
    def _sync_call() -> str:
        client = get_mistral()
        response = client.chat.complete(
            model=get_settings().mistral_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=temperature,
        )
        content = response.choices[0].message.content
        return content if isinstance(content, str) else str(content)

    content = await asyncio.to_thread(_sync_call)
    result: dict[str, Any] = json.loads(content)
    return result
