"""Clause recommendation agent for French real-estate documents."""

from typing import Any

from app.agents.base.orchestrator import Agent

CLAUSE_DATABASE: dict[str, dict[str, str | bool]] = {
    "mortgage_condition": {
        "title": "Condition suspensive d'obtention de pret",
        "text": (
            "La presente vente est conclue sous la condition suspensive de l'obtention "
            "par l'acquereur d'un ou plusieurs prets immobiliers aux conditions formulees."
        ),
        "reason": "Protects the buyer if mortgage financing is denied by financial institutions.",
        "required": True,
    },
    "sru_retraction": {
        "title": "Droit de retractation SRU (Article L. 271-1 du CCH)",
        "text": (
            "L'acquéreur non professionnel dispose d'un delai de retractation de dix jours "
            "a compter de la notification du compromis ou de la promesse de vente."
        ),
        "reason": (
            "Mandatory statutory protection granting a 10-day cooling-off period "
            "for residential buyers."
        ),
        "required": True,
    },
    "prior_sale_condition": {
        "title": "Condition suspensive de vente d'un bien prealable",
        "text": (
            "La presente acquisition est conditionnee a la realisation de la vente "
            "du bien immobilier dont l'acquereur est actuellement proprietaire."
        ),
        "reason": "Protects buyers who rely on proceeds from selling their current property.",
        "required": False,
    },
    "planning_permission": {
        "title": "Condition suspensive d'autorisation d'urbanisme",
        "text": (
            "L'engagement d'acquisition est subordonne a l'obtention pur et simple d'un permis "
            "de construire ou d'une declaration prealable purge de tout recours."
        ),
        "reason": "Essential when buying land or a property requiring structural transformation.",
        "required": False,
    },
    "renovation_works": {
        "title": "Clause relative aux travaux et garanties du vendeur",
        "text": (
            "Le vendeur garantit la conformite et la regularite des travaux realises sur le bien "
            "et s'engage a fournir les attestations d'assurance dommage-ouvrage."
        ),
        "reason": (
            "Protects the buyer regarding recent renovation quality and structural warranties."
        ),
        "required": False,
    },
    "coownership": {
        "title": "Clause de copropriete et loi Carrez",
        "text": (
            "L'acquereur reconnait avoir pris connaissance du carnet d'entretien, du reglement "
            "et de l'attestation de superficie privative loi Carrez."
        ),
        "reason": (
            "Mandatory disclosure and surface guarantee for apartment buyers in a copropriete."
        ),
        "required": True,
    },
}


class ClauseRecommendationAgent(Agent):
    name = "clause_recommendation"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        flags = context.get("options", {}) | context.get("context", {})
        recommendations: list[dict[str, Any]] = []

        if flags.get("buyer_has_mortgage", True):
            recommendations.append(self._build_clause("mortgage_condition"))
        recommendations.append(self._build_clause("sru_retraction"))

        if flags.get("requires_prior_sale"):
            recommendations.append(self._build_clause("prior_sale_condition"))
        if flags.get("requires_planning_permission"):
            recommendations.append(self._build_clause("planning_permission"))
        if flags.get("property_has_renovation"):
            recommendations.append(self._build_clause("renovation_works"))
        if flags.get("is_coownership") or "appartement" in str(flags).lower():
            recommendations.append(self._build_clause("coownership"))

        return {"recommended_clauses": recommendations, "clause_count": len(recommendations)}

    def _build_clause(self, code: str) -> dict[str, Any]:
        clause = CLAUSE_DATABASE[code]
        return {
            "code": code,
            "title": str(clause["title"]),
            "reason": str(clause["reason"]),
            "clause_text": str(clause["text"]),
            "required": bool(clause["required"]),
        }

