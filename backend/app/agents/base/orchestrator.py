"""Orchestration interface — the single swap point for the agent runtime.

The orchestration library is deliberately undecided (LangGraph / Pydantic AI /
hand-rolled). Agents depend on this `Protocol`, not on any concrete library, so
that choice touches only `base/` when it is made. Human-in-the-loop steps and
multi-agent flows are expressed against `run`.
"""

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class Agent(Protocol):
    """A single AI agent: named, invoked with a context, returns a result."""

    name: str

    async def run(self, context: dict[str, Any]) -> dict[str, Any]: ...


@runtime_checkable
class Orchestrator(Protocol):
    """Drives one or more agents. Concrete impl chosen later, lives in base/."""

    async def invoke(self, agent: Agent, context: dict[str, Any]) -> dict[str, Any]: ...
