"""HTTP routes for the buyer-side French real-estate Legal Agent."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.schemas.legal import (
    ComplianceCheckRequest,
    ContractGenerationRequest,
    DocumentAnalysisRequest,
    DocumentChecklistRequest,
    DocumentUploadResponse,
    LegalAgentResponse,
    LegalRAGIngestionRequest,
    LegalRAGIngestionResponse,
    LegalRAGSearchRequest,
    LegalRAGSearchResponse,
    LegalRequest,
)
from app.services.legal_service import LegalService, legal_service

router = APIRouter(prefix="/buyer/legal", tags=["buyer-legal"])


def get_legal_service() -> LegalService:
    return legal_service


@router.post("/ask", response_model=LegalAgentResponse)
async def ask_legal_agent(
    request: LegalRequest,
    service: LegalService = Depends(get_legal_service),
) -> LegalAgentResponse:
    return await service.ask(request)


@router.post("/generate-contract", response_model=LegalAgentResponse)
async def generate_contract(
    request: ContractGenerationRequest,
    service: LegalService = Depends(get_legal_service),
) -> LegalAgentResponse:
    return await service.generate_contract(request)


@router.post("/analyze-document", response_model=LegalAgentResponse)
async def analyze_document(
    request: DocumentAnalysisRequest,
    service: LegalService = Depends(get_legal_service),
) -> LegalAgentResponse:
    return await service.analyze_document(request)


@router.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(
    user_id: str = Form(...),
    file: UploadFile = File(...),
    service: LegalService = Depends(get_legal_service),
) -> DocumentUploadResponse:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded document is empty.")
    try:
        return await service.upload_and_analyze_document(
            user_id=user_id,
            filename=file.filename or "legal_document",
            mime_type=file.content_type or "application/octet-stream",
            content=content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/check-compliance", response_model=LegalAgentResponse)
async def check_compliance(
    request: ComplianceCheckRequest,
    service: LegalService = Depends(get_legal_service),
) -> LegalAgentResponse:
    return await service.check_compliance(request)


@router.get("/document-checklist", response_model=LegalAgentResponse)
async def document_checklist(
    user_id: str,
    transaction_type: str,
    property_type: str | None = None,
    service: LegalService = Depends(get_legal_service),
) -> LegalAgentResponse:
    request = DocumentChecklistRequest(
        user_id=user_id,
        transaction_type=transaction_type,
        property_type=property_type,
    )
    return await service.document_checklist(request)


@router.post("/rag/ingest", response_model=LegalRAGIngestionResponse)
async def ingest_legal_rag(
    request: LegalRAGIngestionRequest,
    service: LegalService = Depends(get_legal_service),
) -> LegalRAGIngestionResponse:
    return await service.ingest_rag_sources(request)


@router.post("/rag/search", response_model=LegalRAGSearchResponse)
async def search_legal_rag(
    request: LegalRAGSearchRequest,
    service: LegalService = Depends(get_legal_service),
) -> LegalRAGSearchResponse:
    return await service.search_rag_sources(request)
