"""Required document checklist agent for buyers."""

from typing import Any

from app.agents.base.orchestrator import Agent

CHECKLISTS: dict[str, list[str]] = {
    "buying_apartment": [
        "Buyer valid identity document (ID / Passport)",
        "Proof of financing / Mortgage pre-approval (Attestation de financement)",
        "Seller property title (Titre de propriété du vendeur)",
        "DDT Technical Diagnostics (DPE, Amiante, Plomb, Electricité, Gaz, ERP, Termites)",
        "Copropriété dossier (Règlement de copropriété, PV d'AG 3 dernières années)",
        "Pre-état daté / Copropriété financial status & charges",
        "Recent property tax notice (Avis de taxe foncière)",
    ],
    "buying_house": [
        "Buyer valid identity document (ID / Passport)",
        "Proof of financing / Mortgage pre-approval (Attestation de financement)",
        "Seller property title (Titre de propriété du vendeur)",
        "DDT Technical Diagnostics (DPE, Amiante, Plomb, Electricité, Gaz, ERP, Termites)",
        "Non-collective sanitation audit (Diagnostic assainissement non collectif)",
        "Urbanism certificate & planning authorizations for prior renovations",
        "Recent property tax notice (Avis de taxe foncière)",
    ],
    "buying_land": [
        "Buyer valid identity document (ID / Passport)",
        "Proof of financing / Mortgage pre-approval",
        "Soil study G1/G2 (Étude de sol géotechnique obligatoire loi ÉLAN)",
        "Operational urbanism certificate (Certificat d'urbanisme opérationnel)",
        "Boundary survey report (Procès-verbal de bornage)",
    ],
    "buying": [
        "Buyer valid identity document (ID / Passport)",
        "Proof of financing / Loan agreement",
        "Seller DDT technical diagnostics packet",
        "Seller property title draft / prior title deed",
    ],
}


class DocumentChecklistAgent(Agent):
    name = "document_checklist"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        property_type = str(context.get("property_type", "")).lower()

        key = f"buying_{property_type}" if property_type else "buying"
        required_documents = CHECKLISTS.get(key, CHECKLISTS["buying"])

        return {
            "transaction_type": "buying",
            "property_type": property_type or None,
            "required_documents": required_documents,
        }


