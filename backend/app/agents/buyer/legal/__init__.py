"""Buyer-side French real-estate legal multi-agent module."""

from app.agents.buyer.legal.agent import LegalAgent
from app.agents.buyer.legal.clause_recommendation import ClauseRecommendationAgent
from app.agents.buyer.legal.compliance_checker import ComplianceCheckerAgent
from app.agents.buyer.legal.contract_generator import ContractGenerationAgent
from app.agents.buyer.legal.document_analyzer import DocumentAnalyzerAgent
from app.agents.buyer.legal.document_checklist import DocumentChecklistAgent
from app.agents.buyer.legal.rag_agent import LegalRAGAgent

__all__ = [
    "ClauseRecommendationAgent",
    "ComplianceCheckerAgent",
    "ContractGenerationAgent",
    "DocumentAnalyzerAgent",
    "DocumentChecklistAgent",
    "LegalAgent",
    "LegalRAGAgent",
]
