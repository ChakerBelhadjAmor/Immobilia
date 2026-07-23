"""Service layer for the Legal Agent module."""

from pathlib import Path
from tempfile import TemporaryDirectory

from app.agents.buyer.legal.agent import LegalAgent
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
    LegalTaskType,
)
from app.services.legal_document_extraction_service import (
    LegalDocumentExtractionService,
    legal_document_extraction_service,
)
from app.services.legal_rag_service import (
    LegalRAGIngestionService,
    LegalRAGSearchService,
    legal_rag_ingestion_service,
    legal_rag_search_service,
)
from app.services.legal_storage_service import LegalStorageService, legal_storage_service


class LegalService:
    """Application service wrapping the legal multi-agent orchestrator."""

    def __init__(
        self,
        legal_agent: LegalAgent | None = None,
        extraction_service: LegalDocumentExtractionService | None = None,
        storage_service: LegalStorageService | None = None,
        rag_ingestion_service: LegalRAGIngestionService | None = None,
        rag_search_service: LegalRAGSearchService | None = None,
    ) -> None:
        self.legal_agent = legal_agent or LegalAgent()
        self.extraction_service = extraction_service or legal_document_extraction_service
        self.storage_service = storage_service or legal_storage_service
        self.rag_ingestion_service = rag_ingestion_service or legal_rag_ingestion_service
        self.rag_search_service = rag_search_service or legal_rag_search_service

    async def ask(self, request: LegalRequest) -> LegalAgentResponse:
        result = await self.legal_agent.run(request.model_dump())
        return LegalAgentResponse.model_validate(result)

    async def generate_contract(
        self, request: ContractGenerationRequest
    ) -> LegalAgentResponse:
        payload = request.model_dump()
        payload["task_type"] = LegalTaskType.CONTRACT_GENERATION
        payload["message"] = f"Generate {request.document_type.value}"
        result = await self.legal_agent.run(payload)
        return LegalAgentResponse.model_validate(result)

    async def analyze_document(self, request: DocumentAnalysisRequest) -> LegalAgentResponse:
        payload = request.model_dump()
        payload["task_type"] = LegalTaskType.DOCUMENT_ANALYSIS
        payload["message"] = f"Analyze uploaded legal document {request.filename}"
        result = await self.legal_agent.run(payload)
        return LegalAgentResponse.model_validate(result)

    async def upload_and_analyze_document(
        self,
        user_id: str,
        filename: str,
        mime_type: str,
        content: bytes,
    ) -> DocumentUploadResponse:
        document_id, storage_key = await self.storage_service.store_content(
            user_id=user_id,
            filename=filename,
            content=content,
            mime_type=mime_type,
        )
        with TemporaryDirectory() as temporary_directory:
            file_path = Path(temporary_directory) / filename
            file_path.write_bytes(content)
            extracted_text = await self.extraction_service.extract_text(file_path, mime_type)

        analysis = await self.analyze_document(
            DocumentAnalysisRequest(
                user_id=user_id,
                document_id=document_id,
                filename=filename,
                mime_type=mime_type,
                storage_key=storage_key,
                extracted_text=extracted_text,
            )
        )
        return DocumentUploadResponse(
            document_id=document_id,
            user_id=user_id,
            filename=filename,
            mime_type=mime_type,
            storage_key=storage_key,
            extracted_text_chars=len(extracted_text),
            analysis=analysis,
        )

    async def check_compliance(self, request: ComplianceCheckRequest) -> LegalAgentResponse:
        payload = request.model_dump()
        payload["task_type"] = LegalTaskType.COMPLIANCE_CHECK
        payload["message"] = f"Check compliance for {request.document_type.value}"
        result = await self.legal_agent.run(payload)
        return LegalAgentResponse.model_validate(result)

    async def document_checklist(self, request: DocumentChecklistRequest) -> LegalAgentResponse:
        payload = request.model_dump()
        payload["task_type"] = LegalTaskType.DOCUMENT_CHECKLIST
        payload["message"] = f"Generate document checklist for {request.transaction_type}"
        result = await self.legal_agent.run(payload)
        return LegalAgentResponse.model_validate(result)

    async def ingest_rag_sources(
        self,
        request: LegalRAGIngestionRequest,
    ) -> LegalRAGIngestionResponse:
        files_processed, chunks_created, skipped_files = await self.rag_ingestion_service.ingest(
            source_root=Path(request.source_root),
            processed_root=Path(request.processed_root),
            category=request.category,
            force=request.force,
        )
        return LegalRAGIngestionResponse(
            files_processed=files_processed,
            chunks_created=chunks_created,
            skipped_files=skipped_files,
        )

    async def search_rag_sources(self, request: LegalRAGSearchRequest) -> LegalRAGSearchResponse:
        results = await self.rag_search_service.search(
            query=request.query,
            category=request.category,
            document_type=request.document_type,
            jurisdiction=request.jurisdiction,
            limit=request.limit,
        )
        return LegalRAGSearchResponse(query=request.query, results=results)


legal_service = LegalService()
