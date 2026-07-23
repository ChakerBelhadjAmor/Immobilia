"""Shared state passed through the Legal Agent workflow."""

from typing import Any, NotRequired, TypedDict

from app.schemas.legal import LegalTaskType


class LegalAgentState(TypedDict):
    user_id: str
    message: str
    context: dict[str, Any]
    conversation_id: NotRequired[str | None]
    document_type: NotRequired[str | None]
    task_type: NotRequired[LegalTaskType]
    history: NotRequired[list[dict[str, Any]]]
    rag_result: NotRequired[dict[str, Any]]
    agent_result: NotRequired[dict[str, Any]]
    response: NotRequired[dict[str, Any]]
    results: NotRequired[dict[str, Any]]
    sources: NotRequired[list[dict[str, Any]]]
    errors: NotRequired[list[str]]
