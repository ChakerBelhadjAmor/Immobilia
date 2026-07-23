"""Legal agent request and response schemas."""

from __future__ import annotations

from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field

LEGAL_DISCLAIMER = (
    "The generated documents are drafts and must be reviewed by a qualified French legal "
    "professional/notary before signature."
)


class LegalTaskType(StrEnum):
    CONTRACT_GENERATION = "contract_generation"
    DOCUMENT_ANALYSIS = "document_analysis"
    COMPLIANCE_CHECK = "compliance_check"
    CLAUSE_RECOMMENDATION = "clause_recommendation"
    LEGAL_RAG = "legal_rag"
    DOCUMENT_CHECKLIST = "document_checklist"
    GENERAL = "general"


class LegalDocumentType(StrEnum):
    COMPROMIS_DE_VENTE = "compromis_de_vente"
    PROMESSE_UNILATERALE_DE_VENTE = "promesse_unilaterale_de_vente"
    OFFRE_ACHAT = "offre_achat_immobilier"
    CONVENTION_INDIVISION = "convention_indivision"
    UNKNOWN = "unknown"


class LegalRiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    BLOCKING = "blocking"


class LegalRequest(BaseModel):
    user_id: str = Field(..., description="Authenticated user identifier.")
    conversation_id: str | None = None
    message: str
    document_type: LegalDocumentType | None = None
    property_id: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)


class ContractGenerationRequest(BaseModel):
    user_id: str
    document_type: LegalDocumentType
    property_id: str | None = None
    parties: dict[str, Any] = Field(default_factory=dict)
    property_details: dict[str, Any] = Field(default_factory=dict)
    financial_terms: dict[str, Any] = Field(default_factory=dict)
    options: dict[str, Any] = Field(default_factory=dict)


class DocumentAnalysisRequest(BaseModel):
    user_id: str
    document_id: str | None = None
    filename: str
    mime_type: str
    storage_key: str | None = None
    extracted_text: str | None = None


class DocumentUploadResponse(BaseModel):
    document_id: str
    user_id: str
    filename: str
    mime_type: str
    storage_key: str
    extracted_text_chars: int
    analysis: LegalAgentResponse


class ComplianceCheckRequest(BaseModel):
    user_id: str
    document_type: LegalDocumentType
    transaction_type: str = Field(default="buying", examples=["buying", "co_buying"])
    document_data: dict[str, Any] = Field(default_factory=dict)


class DocumentChecklistRequest(BaseModel):
    user_id: str
    transaction_type: str = Field(default="buying", examples=["buying"])
    property_type: str | None = Field(default=None, examples=["apartment", "house", "land"])


class LegalRAGIngestionRequest(BaseModel):
    source_root: str = "data/legal_rag/raw"
    processed_root: str = "data/legal_rag/processed"
    category: str | None = None
    force: bool = False


class LegalRAGIngestionResponse(BaseModel):
    files_processed: int
    chunks_created: int
    skipped_files: list[str] = Field(default_factory=list)


class LegalRAGSearchRequest(BaseModel):
    query: str
    category: str | None = None
    document_type: str | None = None
    jurisdiction: str = "FR"
    limit: int = 5


class LegalRAGSearchResult(BaseModel):
    chunk_id: str
    content: str
    score: float
    metadata: dict[str, Any] = Field(default_factory=dict)


class LegalRAGSearchResponse(BaseModel):
    query: str
    results: list[LegalRAGSearchResult]


class ClauseRecommendation(BaseModel):
    code: str
    title: str
    reason: str
    clause_text: str
    required: bool = False


class ComplianceResult(BaseModel):
    risk_level: LegalRiskLevel
    missing_documents: list[str] = Field(default_factory=list)
    missing_clauses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class LegalAgentResponse(BaseModel):
    task_type: LegalTaskType
    summary: str
    result: dict[str, Any] = Field(default_factory=dict)
    sources: list[dict[str, Any]] = Field(default_factory=list)
    compliance: ComplianceResult | None = None
    recommended_clauses: list[ClauseRecommendation] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    disclaimer: str = LEGAL_DISCLAIMER
