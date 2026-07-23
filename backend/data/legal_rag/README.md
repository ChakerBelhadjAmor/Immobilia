# Legal RAG Data

This folder contains source documents and generated ingestion artifacts for the
French real-estate Legal RAG system.

## Structure

```text
data/legal_rag/
  raw/
    legifrance/        # Official laws and codes
    service_public/    # Public administration guides
    anil/              # Housing law guidance
    notaires_france/   # Notarial guidance
    contracts/         # Contract examples and templates
    diagnostics/       # DPE, DDT, asbestos, lead, gas, electricity
    taxes/             # Real-estate taxation references
    rental_rules/      # Lease and tenant/landlord rules
  processed/
    extracted_text/    # Text extracted from PDF/DOCX/images
    chunks/            # Chunked text ready for embedding
    metadata/          # JSON metadata per source/chunk
    embeddings/        # Optional local embedding exports before pgvector import
```

Put original PDFs only under `raw/`. Do not edit them during processing.

Each ingested document should have metadata with:

```json
{
  "category": "rental_rules",
  "document_type": "bail_habitation_vide",
  "law_reference": "Code civil / loi du 6 juillet 1989",
  "jurisdiction": "FR",
  "source": "service_public",
  "last_update": "YYYY-MM-DD"
}
```

Production ingestion flow:

```text
raw PDF/DOCX/image
  -> extracted_text
  -> chunks + metadata
  -> embeddings
  -> PostgreSQL pgvector
```

Current implementation:

```text
raw PDF/DOCX/TXT/MD
  -> app/services/legal_document_extraction_service.py
  -> app/services/legal_rag_service.py
  -> processed/extracted_text + processed/chunks + processed/metadata
  -> LegalRAGAgent source-backed search
```

Run ingestion with:

```bash
python scripts/ingest_legal_rag.py --force
```

or through the API:

```text
POST /legal/rag/ingest
POST /legal/rag/search
```
