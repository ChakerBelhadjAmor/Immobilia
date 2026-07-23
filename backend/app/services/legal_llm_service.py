"""Mistral integration for the Legal Agent."""

import json
from asyncio import to_thread
from typing import Any

from app.agents.base.client import get_mistral
from app.core.config import get_settings
from app.schemas.legal import LegalTaskType


class LegalLLMService:
    """Small Mistral adapter used by legal agents.

    The adapter returns deterministic fallbacks when no API key is configured,
    so development and tests do not require network access.
    """

    async def classify_legal_task(
        self,
        message: str,
        context: dict[str, Any],
        history: list[dict[str, Any]],
    ) -> LegalTaskType:
        if not get_settings().mistral_api_key:
            return self.keyword_classify(message)

        prompt = (
            "Classify this French real-estate legal request. "
            "Return only JSON with key task_type. Allowed values: "
            f"{', '.join(task.value for task in LegalTaskType)}.\n\n"
            f"Message: {message}\n"
            f"Context: {json.dumps(context, default=str, ensure_ascii=False)}\n"
            f"Recent history: {json.dumps(history[-4:], default=str, ensure_ascii=False)}"
        )
        content = await self.complete(
            system=(
                "You route requests for a French real-estate legal multi-agent system. "
                "Return strict JSON only."
            ),
            user=prompt,
            temperature=0.0,
        )

        try:
            parsed = json.loads(content)
            return LegalTaskType(parsed["task_type"])
        except (json.JSONDecodeError, KeyError, ValueError):
            return self.keyword_classify(message)

    async def summarize_response(
        self,
        task_type: LegalTaskType,
        agent_result: dict[str, Any],
    ) -> str:
        if not get_settings().mistral_api_key:
            return self.fallback_summary(task_type, agent_result)

        content = await self.complete(
            system=(
                "You summarize French real-estate legal agent outputs in one concise, "
                "plain-language sentence. Do not provide legal advice."
            ),
            user=(
                f"Task: {task_type.value}\n"
                f"Agent result: {json.dumps(agent_result, default=str, ensure_ascii=False)}"
            ),
            temperature=0.1,
        )
        return content.strip() or self.fallback_summary(task_type, agent_result)

    async def complete(
        self,
        system: str,
        user: str,
        temperature: float = 0.1,
    ) -> str:
        settings = get_settings()
        if not settings.mistral_api_key:
            return ""

        def _call_mistral() -> str:
            client = get_mistral()
            response = client.chat.complete(
                model=settings.mistral_model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=temperature,
            )
            choice = response.choices[0]
            content = choice.message.content
            return content if isinstance(content, str) else str(content)

        try:
            return await to_thread(_call_mistral)
        except Exception:
            return ""

    def keyword_classify(self, message: str) -> LegalTaskType:
        normalized = message.lower()
        if any(word in normalized for word in ["checklist", "documents requis", "liste"]):
            return LegalTaskType.DOCUMENT_CHECKLIST
        if any(word in normalized for word in ["generate", "creer", "créer", "rediger", "rédiger"]):
            return LegalTaskType.CONTRACT_GENERATION
        if any(word in normalized for word in ["compliance", "conforme", "verifier", "vérifier"]):
            return LegalTaskType.COMPLIANCE_CHECK
        if any(word in normalized for word in ["clause", "condition suspensive"]):
            return LegalTaskType.CLAUSE_RECOMMENDATION
        if any(word in normalized for word in ["analyze", "analyse", "uploaded", "document"]):
            return LegalTaskType.DOCUMENT_ANALYSIS
        return LegalTaskType.LEGAL_RAG

    def fallback_summary(self, task_type: LegalTaskType, agent_result: dict[str, Any]) -> str:
        if task_type == LegalTaskType.CONTRACT_GENERATION:
            if agent_result.get("missing_information"):
                return "Contract draft is pending missing mandatory information."
            return "Contract draft generated with recommended French real-estate clauses."
        if task_type == LegalTaskType.COMPLIANCE_CHECK:
            risk_level = agent_result.get("risk_level", "unknown")
            return f"Compliance check completed with {risk_level} risk."
        if task_type == LegalTaskType.DOCUMENT_ANALYSIS:
            return "Document analysis completed with extracted legal entities and clauses."
        if task_type == LegalTaskType.DOCUMENT_CHECKLIST:
            return "Required document checklist generated."
        if task_type == LegalTaskType.CLAUSE_RECOMMENDATION:
            return "Legal clause recommendations generated."
        return "French real-estate legal context retrieved."


legal_llm_service = LegalLLMService()
