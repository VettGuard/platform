"""POST /v1/ai/classify-document — classify a document referenced by blob URL.

Foundation phase: route exercises the full Claude call path (system prompt
cache, JSON parsing, structured response) but uses the URL string as
placeholder content. Phase 2 wires OCR (Tesseract or Claude Vision) so a
real document image gets read into the user_message.
"""

from __future__ import annotations

import json
import time

from fastapi import APIRouter, HTTPException

from ..anthropic_client import complete
from ..budget import get_budget
from ..config import get_settings
from ..logging import get_logger
from ..metrics import (
    budget_rejections_total,
    request_latency_seconds,
    requests_total,
    tokens_cache_creation_total,
    tokens_cache_read_total,
    tokens_input_total,
    tokens_output_total,
)
from ..prompts import classify_document as classify_prompt
from ..schemas import (
    ClassifyDocumentRequest,
    ClassifyDocumentResponse,
    ClaudeModel,
    DocumentType,
)

router = APIRouter(prefix="/v1/ai", tags=["ai"])
log = get_logger(__name__)


@router.post("/classify-document", response_model=ClassifyDocumentResponse)
async def classify(req: ClassifyDocumentRequest) -> ClassifyDocumentResponse:
    settings = get_settings()
    budget = get_budget(settings.daily_tenant_token_budget)
    model = ClaudeModel.HAIKU_4_5

    allowed, remaining = await budget.check(req.ctx.tenant_id)
    if not allowed:
        budget_rejections_total.labels(tenant_id=req.ctx.tenant_id).inc()
        requests_total.labels(route="classify", model=model.value, outcome="budget").inc()
        raise HTTPException(status_code=429, detail="daily token budget exhausted")

    started = time.perf_counter()
    try:
        raw, usage = await complete(
            model=model,
            system_prompt=classify_prompt.PROMPT,
            user_message=f"Document URL (placeholder for OCR text): {req.blob_url}",
            max_tokens=128,
            cache_system=True,
        )
    except Exception:
        requests_total.labels(route="classify", model=model.value, outcome="error").inc()
        raise
    finally:
        request_latency_seconds.labels(route="classify", model=model.value).observe(
            time.perf_counter() - started
        )

    labels = {"tenant_id": req.ctx.tenant_id, "model": model.value, "route": "classify"}
    tokens_input_total.labels(**labels).inc(usage.input_tokens)
    tokens_output_total.labels(**labels).inc(usage.output_tokens)
    tokens_cache_read_total.labels(**labels).inc(usage.cache_read_input_tokens)
    tokens_cache_creation_total.labels(**labels).inc(usage.cache_creation_input_tokens)

    total_billable = (
        usage.input_tokens
        + usage.cache_creation_input_tokens
        + usage.cache_read_input_tokens
        + usage.output_tokens
    )
    await budget.charge(req.ctx.tenant_id, total_billable)

    try:
        payload = json.loads(raw.strip())
        doc_type = DocumentType(payload["type"])
        confidence = float(payload["confidence"])
    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        requests_total.labels(route="classify", model=model.value, outcome="parse_error").inc()
        log.error("classify.parse_failed", raw=raw[:200], error=str(exc))
        raise HTTPException(status_code=502, detail="classifier returned malformed JSON") from exc

    requests_total.labels(route="classify", model=model.value, outcome="ok").inc()
    log.info(
        "classify.complete",
        tenant_id=req.ctx.tenant_id,
        type=doc_type.value,
        confidence=confidence,
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
        budget_remaining_pre=remaining,
    )
    return ClassifyDocumentResponse(type=doc_type, confidence=confidence, usage=usage)
