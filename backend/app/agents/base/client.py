"""Lazy Mistral client singleton.

Mistral is the only declared AI provider. All agents obtain their LLM handle
here so the SDK is configured in one place.
"""

from typing import TYPE_CHECKING

from app.core.config import get_settings

if TYPE_CHECKING:
    from mistralai import Mistral  # type: ignore[attr-defined]

_client: "Mistral | None" = None


def get_mistral() -> "Mistral":
    global _client
    if _client is None:
        from mistralai import Mistral  # type: ignore[attr-defined]

        _client = Mistral(api_key=get_settings().mistral_api_key)
    return _client
