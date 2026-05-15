"""Shared Pydantic schemas matching v1/ai.proto contract."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ClaudeModel(str, Enum):
    HAIKU_4_5 = "claude-haiku-4-5"
    SONNET_4_6 = "claude-sonnet-4-6"
    OPUS_4_7 = "claude-opus-4-7"


class DocumentType(str, Enum):
    BOL = "bol"
    RATE_CONFIRMATION = "rate_confirmation"
    LUMPER_RECEIPT = "lumper_receipt"
    DETENTION_PROOF = "detention_proof"
    INVOICE = "invoice"
    OTHER = "other"


class TokenUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_input_tokens: int = 0
    cache_creation_input_tokens: int = 0


class TenantContext(BaseModel):
    tenant_id: str
    user_id: str | None = None
    request_id: str | None = None
    trace_id: str | None = None


class EchoRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2_000)
    model: ClaudeModel = ClaudeModel.HAIKU_4_5
    ctx: TenantContext


class EchoResponse(BaseModel):
    reply: str
    usage: TokenUsage
    trace_id: str | None = None


class ClassifyDocumentRequest(BaseModel):
    blob_url: str = Field(min_length=1)
    ctx: TenantContext


class ClassifyDocumentResponse(BaseModel):
    type: DocumentType
    confidence: float = Field(ge=0.0, le=1.0)
    usage: TokenUsage
