"""Legal domain ORM models.

Security posture:
- `storage_key` points to user-scoped encrypted object storage.
- Sensitive extracted text is not stored directly here.
- Audit rows track access and generation actions.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class LegalDocument(Base):
    __tablename__ = "legal_documents"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    property_id: Mapped[str | None] = mapped_column(String(64), index=True)
    document_type: Mapped[str] = mapped_column(String(80), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(120))
    storage_key: Mapped[str] = mapped_column(String(512), unique=True)
    encrypted_content_key: Mapped[str] = mapped_column(String(512))
    extraction_status: Mapped[str] = mapped_column(String(40), default="pending")
    extracted_metadata: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    document_type: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(255))
    jurisdiction: Mapped[str] = mapped_column(String(8), default="FR")
    version: Mapped[str] = mapped_column(String(40))
    content: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Clause(Base):
    __tablename__ = "clauses"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    code: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(120), index=True)
    document_type: Mapped[str] = mapped_column(String(80), index=True)
    law_reference: Mapped[str | None] = mapped_column(String(255))
    jurisdiction: Mapped[str] = mapped_column(String(8), default="FR")
    body: Mapped[str] = mapped_column(Text)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    last_update: Mapped[datetime] = mapped_column(server_default=func.now())


class LegalKnowledgeChunk(Base):
    __tablename__ = "legal_knowledge_chunks"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    source: Mapped[str] = mapped_column(String(120), index=True)
    category: Mapped[str] = mapped_column(String(120), index=True)
    document_type: Mapped[str] = mapped_column(String(120), index=True)
    law_reference: Mapped[str | None] = mapped_column(String(255))
    jurisdiction: Mapped[str] = mapped_column(String(8), default="FR", index=True)
    last_update: Mapped[str | None] = mapped_column(String(40))
    source_path: Mapped[str] = mapped_column(String(512))
    chunk_index: Mapped[int] = mapped_column(index=True)
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float] | None] = mapped_column(JSONB)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class LegalTemplate(Base):
    __tablename__ = "templates"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    template_key: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    document_type: Mapped[str] = mapped_column(String(80), index=True)
    version: Mapped[str] = mapped_column(String(40))
    storage_key: Mapped[str | None] = mapped_column(String(512))
    content: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    required_fields: Mapped[list[str]] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class LegalGeneratedContract(Base):
    # Docs §2 reserve `generated_contracts` for the coloc/tools module; the
    # legal agent's contract output lives in its own table to avoid collision.
    __tablename__ = "legal_generated_contracts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    property_id: Mapped[str | None] = mapped_column(String(64), index=True)
    template_id: Mapped[str | None] = mapped_column(ForeignKey("templates.id"))
    document_type: Mapped[str] = mapped_column(String(80), index=True)
    status: Mapped[str] = mapped_column(String(40), default="draft")
    content: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    docx_storage_key: Mapped[str | None] = mapped_column(String(512))
    pdf_storage_key: Mapped[str | None] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class LegalAuditLog(Base):
    __tablename__ = "legal_audit_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    action: Mapped[str] = mapped_column(String(120), index=True)
    resource_type: Mapped[str] = mapped_column(String(120))
    resource_id: Mapped[str | None] = mapped_column(String(120), index=True)
    ip_address: Mapped[str | None] = mapped_column(String(80))
    details: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
