"""POST /v1/ai/classify-document — classify a document referenced by blob URL.

Foundation phase: the route accepts the URL, returns a stub classification.
Phase 2 will fetch + OCR the document, then invoke Claude.
"""

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from ..anthropic_client import complete
from ..logging import get_logger
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
    # Foundation stub — Phase 2 will fetch+OCR. For now, send the URL itself to Claude
    # as a placeholder so the wiring (model selection, caching, structured JSON) is exercised.
    raw, usage = await complete(
        model=ClaudeModel.HAIKU_4_5,
        system_prompt=classify_prompt.PROMPT,
        user_message=f"Document URL (placeholder for OCR text): {req.blob_url}",
        max_tokens=128,
        cache_system=True,
    )

    try:
        payload = json.loads(raw.strip())
        doc_type = DocumentType(payload["type"])
        confidence = float(payload["confidence"])
    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        log.error("classify.parse_failed", raw=raw[:200], error=str(exc))
        raise HTTPException(status_code=502, detail="classifier returned malformed JSON") from exc

    log.info(
        "classify.complete",
        tenant_id=req.ctx.tenant_id,
        type=doc_type.value,
        confidence=confidence,
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
    )
    return ClassifyDocumentResponse(type=doc_type, confidence=confidence, usage=usage)
