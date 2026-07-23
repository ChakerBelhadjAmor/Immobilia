"""Legal document analysis agent."""

import re
from typing import Any

from app.agents.base.orchestrator import Agent


class DocumentAnalyzerAgent(Agent):
    name = "document_analyzer"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        text = str(context.get("extracted_text") or context.get("message") or "")
        document_type = self._classify_document(text, str(context.get("filename", "")))

        return {
            "document_type": document_type,
            "entities": {
                "names": self._extract_names(text),
                "addresses": self._extract_addresses(text),
                "dates": self._extract_dates(text),
                "prices": self._extract_prices(text),
            },
            "clauses": self._extract_clause_titles(text),
            "obligations": self._extract_obligations(text),
            "confidence": "medium" if text else "low",
            "processing_notes": [
                "OCR/PyMuPDF/python-docx extraction should populate extracted_text before analysis."
            ],
        }

    def _classify_document(self, text: str, filename: str) -> str:
        haystack = f"{filename} {text}".lower()
        if "offre" in haystack or "achat" in haystack:
            return "offre_achat_immobilier"
        if "compromis" in haystack:
            return "compromis_de_vente"
        if "promesse" in haystack:
            return "promesse_unilaterale_de_vente"
        if "indivision" in haystack:
            return "convention_indivision"
        if "diagnostic" in haystack or "dpe" in haystack or "ddt" in haystack:
            return "ddt_diagnostics"
        if "etat date" in haystack or "état daté" in haystack:
            return "pre_etat_date"
        return "unknown"

    def _extract_names(self, text: str) -> list[str]:
        return re.findall(r"\b(?:M\.|Mme|Monsieur|Madame)\s+[A-Z][A-Za-zÀ-ÿ '-]+", text)

    def _extract_addresses(self, text: str) -> list[str]:
        return re.findall(r"\d{1,4}\s+[A-Za-zÀ-ÿ0-9' -]+,\s*\d{5}\s+[A-Za-zÀ-ÿ' -]+", text)

    def _extract_dates(self, text: str) -> list[str]:
        return re.findall(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", text)

    def _extract_prices(self, text: str) -> list[str]:
        return re.findall(r"\b\d[\d\s.,]{2,}\s*(?:EUR|€|euros?)\b", text, flags=re.IGNORECASE)

    def _extract_clause_titles(self, text: str) -> list[str]:
        return re.findall(
            r"(?:Article|Clause)\s+\d+\s*[:.-]\s*([^\n\r]+)", text, flags=re.IGNORECASE
        )

    def _extract_obligations(self, text: str) -> list[str]:
        sentences = re.split(r"(?<=[.!?])\s+", text)
        return [
            sentence.strip()
            for sentence in sentences
            if any(marker in sentence.lower() for marker in ["s'engage", "doit", "obligation"])
        ][:10]

