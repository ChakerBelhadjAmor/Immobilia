"""Compliance checker agent for French buyer real-estate requirements."""

from typing import Any

from app.agents.base.orchestrator import Agent
from app.schemas.legal import LegalRiskLevel

BUYER_ACQUISITION_REQUIREMENTS = {
    "documents": [
        "seller_identity",
        "property_title",
        "ddt_diagnostics",
        "dpe_energy_audit",
        "pre_etat_date_copropriete",
    ],
    "clauses": [
        "agreed_price",
        "property_description",
        "mortgage_suspensive_condition",
        "sru_10_day_withdrawal_rights",
        "signature_validity_date",
    ],
}


class ComplianceCheckerAgent(Agent):
    name = "compliance_checker"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        document_data = context.get("document_data", {}) | context.get("context", {})

        requirements = BUYER_ACQUISITION_REQUIREMENTS
        missing_documents = [
            item for item in requirements["documents"] if not document_data.get(item)
        ]
        missing_clauses = [item for item in requirements["clauses"] if not document_data.get(item)]

        risk_level = self._risk_level(missing_documents, missing_clauses)
        recommendations = self._recommendations(missing_documents, missing_clauses)

        return {
            "risk_level": risk_level,
            "missing_documents": missing_documents,
            "missing_clauses": missing_clauses,
            "recommendations": recommendations,
        }

    def _risk_level(self, missing_documents: list[str], missing_clauses: list[str]) -> str:
        missing_count = len(missing_documents) + len(missing_clauses)
        if missing_count == 0:
            return LegalRiskLevel.LOW.value
        if any(
            item in missing_documents
            for item in ["property_title", "ddt_diagnostics", "dpe_energy_audit"]
        ) or "mortgage_suspensive_condition" in missing_clauses:
            return LegalRiskLevel.BLOCKING.value
        if missing_count <= 2:
            return LegalRiskLevel.MEDIUM.value
        return LegalRiskLevel.HIGH.value

    def _recommendations(
        self, missing_documents: list[str], missing_clauses: list[str]
    ) -> list[str]:
        recommendations = []
        if missing_documents:
            recommendations.append(
                "Request and verify missing mandatory seller documents "
                "(title, DDT/DPE diagnostics, copropriété status) before signing."
            )
        if missing_clauses:
            recommendations.append(
                "Ensure buyer protective clauses (mortgage suspensive condition, "
                "10-day SRU withdrawal rights) are included with your notary."
            )
        if not recommendations:
            recommendations.append(
                "No blocking compliance gap detected from provided buyer structured data."
            )
        return recommendations


