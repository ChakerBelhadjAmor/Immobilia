# Buyer Legal Agent Architecture

```text
User Request
    |
    v
LegalAgent (Buyer Legal Advisor)
    |
    +--> load_state
    +--> classify_request
    +--> LegalRAGAgent
    +--> route
          +--> ContractGenerationAgent
          +--> DocumentAnalyzerAgent
          +--> ComplianceCheckerAgent
          +--> ClauseRecommendationAgent
          +--> DocumentChecklistAgent
          +--> LegalRAGAgent answer
    +--> combine
    +--> persist_state
```

The LegalAgent executes `workflow.py` strictly for buyer-side real-estate acquisition workflows. When LangGraph is installed, routing runs
as a compiled graph. In local development without LangGraph, the fallback keeps
the same async `ainvoke(state)` behavior.

Conversation state is persisted in Redis with keys shaped as:

```text
legal:conversation:{user_id}:{conversation_id}
```

Mistral is used for request classification and concise response summaries when
`MISTRAL_API_KEY` is configured. Without a key, deterministic fallback logic is
used so tests and local imports keep working.

RAG source documents live under:

```text
data/legal_rag/raw/
```

Ingestion writes extracted text, chunks, and metadata under:

```text
data/legal_rag/processed/
```

Document upload and extraction is exposed through:

```text
POST /buyer/legal/upload-document
```

Supported extraction:
- PDF through PyMuPDF.
- DOCX through python-docx.
- TXT/MD/JSON directly.
- Images and scanned PDFs through optional Tesseract OCR.

Security requirements:
- Documents must be stored under user-scoped object-storage keys.
- Sensitive document bodies should be encrypted before S3/MinIO persistence.
- Endpoints must be protected by auth dependencies before public deployment.
- Access and generation actions should be written to `legal_audit_logs`.
- Users may only access documents and generated contracts matching their user id.
- Legal conversation state must be scoped by both `user_id` and `conversation_id`.

Disclaimer:

The generated documents are drafts and must be reviewed by a qualified French
legal professional/notary before signature.
