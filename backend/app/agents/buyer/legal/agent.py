"""Top-level Legal Agent orchestrating specialized legal sub-agents."""

from typing import Any

from app.agents.base.orchestrator import Agent
from app.agents.buyer.legal.workflow import LegalWorkflowRuntime, build_legal_workflow
from app.services.legal_conversation_state import LegalConversationStateService
from app.services.legal_llm_service import LegalLLMService


class LegalAgent(Agent):
    """Main legal orchestrator for French real-estate workflows.

    The public surface stays simple: callers pass a context dict and receive a
    normalized response dict. Internally, routing is handled by LangGraph when
    available, with an async fallback for local development.
    """

    name = "legal"

    def __init__(
        self,
        state_service: LegalConversationStateService | None = None,
        llm_service: LegalLLMService | None = None,
    ) -> None:
        runtime = LegalWorkflowRuntime(
            state_service=state_service,
            llm_service=llm_service,
        )
        self.workflow = build_legal_workflow(runtime)

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        state = {
            "user_id": str(context["user_id"]),
            "conversation_id": self._conversation_id(context.get("conversation_id")),
            "message": str(context.get("message", "")),
            "document_type": self._document_type(context.get("document_type")),
            "context": context,
        }
        final_state = await self.workflow.ainvoke(state)
        result = final_state.get("results") or final_state.get("response") or {}
        return dict(result)

    def _conversation_id(self, conversation_id: Any) -> str | None:
        return str(conversation_id) if conversation_id else None

    def _document_type(self, document_type: Any) -> str | None:
        if document_type is None:
            return None
        value = getattr(document_type, "value", document_type)
        return str(value)
