"""Prompt template loader.

Templates live as files under `app/agents/prompts/` so prompt text is versioned
and edited without touching code.
"""

from pathlib import Path

_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


def load_prompt(name: str) -> str:
    """Return the raw text of `prompts/<name>` (e.g. "seller/price_estimate.md")."""
    return (_PROMPTS_DIR / name).read_text(encoding="utf-8")
