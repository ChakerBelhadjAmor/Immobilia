"""Contract generation agent for French real-estate drafts."""

from typing import Any

from app.agents.base.orchestrator import Agent
from app.agents.buyer.legal.clause_recommendation import ClauseRecommendationAgent
from app.schemas.legal import LEGAL_DISCLAIMER

MANDATORY_FIELDS: dict[str, list[str]] = {
    "offre_achat_immobilier": ["buyer_name", "property_address", "offer_price"],
    "compromis_de_vente": ["seller_name", "buyer_name", "property_address", "price"],
    "promesse_unilaterale_de_vente": ["seller_name", "buyer_name", "property_address", "price"],
    "convention_indivision": ["coowners", "property_address", "ownership_shares"],
}


class ContractGenerationAgent(Agent):
    name = "contract_generation"

    def __init__(self, clause_agent: ClauseRecommendationAgent | None = None) -> None:
        self.clause_agent = clause_agent or ClauseRecommendationAgent()

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        document_type = str(context.get("document_type", "unknown"))
        payload = self._flatten_context(context)
        missing_information = [
            field for field in MANDATORY_FIELDS.get(document_type, []) if not payload.get(field)
        ]
        clause_result = await self.clause_agent.run(context)

        draft = None
        if not missing_information:
            draft = self._render_draft(document_type, payload, clause_result["recommended_clauses"])

        return {
            "document_type": document_type,
            "template_key": document_type,
            "missing_information": missing_information,
            "recommended_clauses": clause_result["recommended_clauses"],
            "draft": draft,
            "export_targets": ["docx", "pdf"],
            "disclaimer": LEGAL_DISCLAIMER,
        }

    def _flatten_context(self, context: dict[str, Any]) -> dict[str, Any]:
        flattened = dict(context)
        for key in ["parties", "property_details", "financial_terms", "options", "context"]:
            value = context.get(key)
            if isinstance(value, dict):
                flattened.update(value)
        return flattened

    def _render_draft(
        self, document_type: str, payload: dict[str, Any], clauses: list[dict[str, Any]]
    ) -> dict[str, Any]:
        clause_blocks = [
            {"title": clause["title"], "body": clause["clause_text"], "reason": clause["reason"]}
            for clause in clauses
        ]
        return {
            "title": document_type.replace("_", " ").title(),
            "parties": {
                key: value
                for key, value in payload.items()
                if key.endswith("_name") or key in {"coowners"}
            },
            "property": {"address": payload.get("property_address")},
            "financial_terms": {
                "price": payload.get("price") or payload.get("offer_price"),
                "rent": payload.get("rent"),
            },
            "clauses": clause_blocks,
        }
