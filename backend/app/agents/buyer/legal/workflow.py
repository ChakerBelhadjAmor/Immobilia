"""LangGraph workflow factory for the Legal Agent."""

from typing import Any

from app.agents.buyer.legal.clause_recommendation import ClauseRecommendationAgent
from app.agents.buyer.legal.compliance_checker import ComplianceCheckerAgent
from app.agents.buyer.legal.contract_generator import ContractGenerationAgent
from app.agents.buyer.legal.document_analyzer import DocumentAnalyzerAgent
from app.agents.buyer.legal.document_checklist import DocumentChecklistAgent
from app.agents.buyer.legal.rag_agent import LegalRAGAgent
from app.agents.buyer.legal.state import LegalAgentState
from app.schemas.legal import LEGAL_DISCLAIMER, LegalTaskType
from app.services.legal_conversation_state import (
    LegalConversationStateService,
    legal_conversation_state,
)
from app.services.legal_llm_service import LegalLLMService, legal_llm_service


class LegalWorkflowRuntime:
    """Runtime dependencies shared by LangGraph nodes and fallback workflow."""

    def __init__(
        self,
        state_service: LegalConversationStateService | None = None,
        llm_service: LegalLLMService | None = None,
    ) -> None:
        self.state_service = state_service or legal_conversation_state
        self.llm_service = llm_service or legal_llm_service
        self.contract_generator = ContractGenerationAgent()
        self.document_analyzer = DocumentAnalyzerAgent()
        self.compliance_checker = ComplianceCheckerAgent()
        self.clause_agent = ClauseRecommendationAgent()
        self.rag_agent = LegalRAGAgent()
        self.checklist_agent = DocumentChecklistAgent()

    async def load_state(self, state: LegalAgentState) -> LegalAgentState:
        conversation_id = state.get("conversation_id")
        history = await self.state_service.load_history(state["user_id"], conversation_id)
        state["history"] = history
        await self.state_service.append_turn(
            state["user_id"],
            conversation_id,
            "user",
            {"message": state["message"], "context": state.get("context", {})},
        )
        return state

    async def classify(self, state: LegalAgentState) -> LegalAgentState:
        context = state.get("context", {})
        explicit_task = context.get("task_type")
        if explicit_task:
            state["task_type"] = LegalTaskType(explicit_task)
            return state

        state["task_type"] = await self.llm_service.classify_legal_task(
            message=state["message"],
            context=context,
            history=state.get("history", []),
        )
        return state

    async def retrieve_legal_context(self, state: LegalAgentState) -> LegalAgentState:
        state["rag_result"] = await self.rag_agent.run(self._context_from_state(state))
        return state

    async def run_contract_generator(self, state: LegalAgentState) -> LegalAgentState:
        state["agent_result"] = await self.contract_generator.run(self._context_from_state(state))
        return state

    async def run_document_analyzer(self, state: LegalAgentState) -> LegalAgentState:
        state["agent_result"] = await self.document_analyzer.run(self._context_from_state(state))
        return state

    async def run_compliance_checker(self, state: LegalAgentState) -> LegalAgentState:
        state["agent_result"] = await self.compliance_checker.run(self._context_from_state(state))
        return state

    async def run_clause_recommendation(self, state: LegalAgentState) -> LegalAgentState:
        state["agent_result"] = await self.clause_agent.run(self._context_from_state(state))
        return state

    async def run_document_checklist(self, state: LegalAgentState) -> LegalAgentState:
        state["agent_result"] = await self.checklist_agent.run(self._context_from_state(state))
        return state

    async def run_rag_answer(self, state: LegalAgentState) -> LegalAgentState:
        state["agent_result"] = {
            "answer": "Retrieved French real-estate legal context for the request."
        }
        return state

    async def combine(self, state: LegalAgentState) -> LegalAgentState:
        task_type = state.get("task_type", LegalTaskType.LEGAL_RAG)
        agent_result = state.get("agent_result", {})
        rag_result = state.get("rag_result", {})
        summary = await self.llm_service.summarize_response(task_type, agent_result)
        response = {
            "task_type": task_type,
            "summary": summary,
            "result": agent_result,
            "sources": rag_result.get("sources", []),
            "compliance": agent_result if task_type == LegalTaskType.COMPLIANCE_CHECK else None,
            "recommended_clauses": agent_result.get("recommended_clauses", []),
            "missing_information": agent_result.get("missing_information", []),
            "disclaimer": LEGAL_DISCLAIMER,
        }
        state["response"] = response
        state["results"] = response
        state["sources"] = response["sources"]
        return state

    async def persist(self, state: LegalAgentState) -> LegalAgentState:
        await self.state_service.append_turn(
            state["user_id"],
            state.get("conversation_id"),
            "assistant",
            state.get("response", {}),
        )
        return state

    def route(self, state: LegalAgentState) -> str:
        task_type = state.get("task_type", LegalTaskType.LEGAL_RAG)
        return {
            LegalTaskType.CONTRACT_GENERATION: "contract_generator",
            LegalTaskType.DOCUMENT_ANALYSIS: "document_analyzer",
            LegalTaskType.COMPLIANCE_CHECK: "compliance_checker",
            LegalTaskType.CLAUSE_RECOMMENDATION: "clause_recommendation",
            LegalTaskType.DOCUMENT_CHECKLIST: "document_checklist",
            LegalTaskType.LEGAL_RAG: "rag_answer",
            LegalTaskType.GENERAL: "rag_answer",
        }[task_type]

    def _context_from_state(self, state: LegalAgentState) -> dict[str, Any]:
        context = dict(state.get("context", {}))
        context.update(
            {
                "user_id": state["user_id"],
                "conversation_id": state.get("conversation_id"),
                "message": state["message"],
                "document_type": state.get("document_type") or context.get("document_type"),
                "history": state.get("history", []),
            }
        )
        return context


def build_legal_workflow(
    runtime: LegalWorkflowRuntime | None = None,
) -> Any:
    """Build the Legal Agent LangGraph workflow.

    If LangGraph is not installed yet, returns an async-compatible fallback with
    the same `ainvoke(state)` surface.
    """

    runtime = runtime or LegalWorkflowRuntime()
    try:
        from langgraph.graph import END, StateGraph
    except ImportError:
        return LegalWorkflowFallback(runtime)

    workflow = StateGraph(LegalAgentState)
    workflow.add_node("load_state", runtime.load_state)
    workflow.add_node("classify", runtime.classify)
    workflow.add_node("rag_retrieval", runtime.retrieve_legal_context)
    workflow.add_node("contract_generator", runtime.run_contract_generator)
    workflow.add_node("document_analyzer", runtime.run_document_analyzer)
    workflow.add_node("compliance_checker", runtime.run_compliance_checker)
    workflow.add_node("clause_recommendation", runtime.run_clause_recommendation)
    workflow.add_node("document_checklist", runtime.run_document_checklist)
    workflow.add_node("rag_answer", runtime.run_rag_answer)
    workflow.add_node("combine", runtime.combine)
    workflow.add_node("persist", runtime.persist)

    workflow.set_entry_point("load_state")
    workflow.add_edge("load_state", "classify")
    workflow.add_edge("classify", "rag_retrieval")
    workflow.add_conditional_edges(
        "rag_retrieval",
        runtime.route,
        {
            "contract_generator": "contract_generator",
            "document_analyzer": "document_analyzer",
            "compliance_checker": "compliance_checker",
            "clause_recommendation": "clause_recommendation",
            "document_checklist": "document_checklist",
            "rag_answer": "rag_answer",
        },
    )

    for node_name in [
        "contract_generator",
        "document_analyzer",
        "compliance_checker",
        "clause_recommendation",
        "document_checklist",
        "rag_answer",
    ]:
        workflow.add_edge(node_name, "combine")

    workflow.add_edge("combine", "persist")
    workflow.add_edge("persist", END)
    return workflow.compile()


class LegalWorkflowFallback:
    """Async-compatible fallback matching the compiled LangGraph surface."""

    def __init__(self, runtime: LegalWorkflowRuntime) -> None:
        self.runtime = runtime

    async def ainvoke(self, state: LegalAgentState) -> LegalAgentState:
        state = await self.runtime.load_state(state)
        state = await self.runtime.classify(state)
        state = await self.runtime.retrieve_legal_context(state)
        route = self.runtime.route(state)
        route_handlers = {
            "contract_generator": self.runtime.run_contract_generator,
            "document_analyzer": self.runtime.run_document_analyzer,
            "compliance_checker": self.runtime.run_compliance_checker,
            "clause_recommendation": self.runtime.run_clause_recommendation,
            "document_checklist": self.runtime.run_document_checklist,
            "rag_answer": self.runtime.run_rag_answer,
        }
        state = await route_handlers[route](state)
        state = await self.runtime.combine(state)
        return await self.runtime.persist(state)
