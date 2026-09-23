"""POST /v1/ai/draft-claim — generate a detention invoice email.

Same scaffolding as score_broker: budget gate, retried completion via
the shared client with system-prompt caching, strict-JSON parse with
fence-tolerance + neutral fallback. Returns `{subject, body}` plus the
token usage.
"""

from __future__ import annotations

import json
import time
from typing import Any

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
from ..prompts import draft_claim as draft_claim_prompt
from ..schemas import DraftClaimRequest, DraftClaimResponse, TokenUsage

router = APIRouter(prefix="/v1/ai", tags=["ai"])
log = get_logger(__name__)

# Last-resort fallback so the caller always gets a usable shape.
_FALLBACK: dict[str, Any] = {
    "subject": "Detention invoice",
    "body": (
        "Detention invoice for the recent load — please see attached "
        "evidence and remit per your standard payment cycle."
    ),
}


def _build_user_message(req: DraftClaimRequest) -> str:
    amount = f"${req.claim_amount_cents / 100:.2f}"
    parts: list[str] = [
        f"Broker MC: {req.broker_mc}",
        f"Broker name: {req.broker_name or '(unknown — address generically)'}",
        f"Load reference: {req.load_ref or '(TBD)'}",
        f"Dwell beyond free window: {req.dwell_hours:.1f} hours",
        f"Total detention charge: {amount}",
    ]
    if req.signals:
        parts.append("Additional context:\n" + req.signals)
    return "\n".join(parts)


def _parse_payload(text: str) -> dict[str, Any]:
    """Pull a JSON object out of the model reply, tolerating a leading
    ```json fence even though the prompt forbids it."""
    s = text.strip()
    if s.startswith("```"):
        s = s.split("```", 2)[1] if s.count("```") >= 2 else s.lstrip("`")
        if s.startswith("json"):
            s = s[4:]
    try:
        obj = json.loads(s)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass
    return dict(_FALLBACK)


@router.post("/draft-claim", response_model=DraftClaimResponse)
async def draft_claim(req: DraftClaimRequest) -> DraftClaimResponse:
    settings = get_settings()
    budget = get_budget(settings.daily_tenant_token_budget)

    allowed, remaining = await budget.check(req.ctx.tenant_id)
    if not allowed:
        budget_rejections_total.labels(tenant_id=req.ctx.tenant_id).inc()
        requests_total.labels(
            route="draft_claim", model=req.model.value, outcome="budget"
        ).inc()
        raise HTTPException(status_code=429, detail="daily token budget exhausted")

    started = time.perf_counter()
    try:
        text, usage = await complete(
            model=req.model,
            system_prompt=draft_claim_prompt.PROMPT,
            user_message=_build_user_message(req),
            max_tokens=600,
            cache_system=True,
        )
    except Exception:
        requests_total.labels(
            route="draft_claim", model=req.model.value, outcome="error"
        ).inc()
        raise
    finally:
        request_latency_seconds.labels(
            route="draft_claim", model=req.model.value
        ).observe(time.perf_counter() - started)

    payload = _parse_payload(text)
    subject = str(payload.get("subject", _FALLBACK["subject"]))[:60]
    body = str(payload.get("body", _FALLBACK["body"]))[:4000]
    # Empty either → fall through to fallback so we never ship blanks.
    if not subject.strip():
        subject = _FALLBACK["subject"]
    if not body.strip():
        body = _FALLBACK["body"]

    labels = {
        "tenant_id": req.ctx.tenant_id,
        "model": req.model.value,
        "route": "draft_claim",
    }
    tokens_input_total.labels(**labels).inc(usage.input_tokens)
    tokens_output_total.labels(**labels).inc(usage.output_tokens)
    tokens_cache_read_total.labels(**labels).inc(usage.cache_read_input_tokens)
    tokens_cache_creation_total.labels(**labels).inc(usage.cache_creation_input_tokens)
    requests_total.labels(
        route="draft_claim", model=req.model.value, outcome="ok"
    ).inc()

    total_billable = (
        usage.input_tokens
        + usage.cache_creation_input_tokens
        + usage.cache_read_input_tokens
        + usage.output_tokens
    )
    await budget.charge(req.ctx.tenant_id, total_billable)

    log.info(
        "draft_claim.complete",
        tenant_id=req.ctx.tenant_id,
        broker_mc=req.broker_mc,
        dwell_hours=req.dwell_hours,
        budget_remaining_pre=remaining,
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
    )

    return DraftClaimResponse(
        subject=subject,
        body=body,
        usage=TokenUsage(
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            cache_read_input_tokens=usage.cache_read_input_tokens,
            cache_creation_input_tokens=usage.cache_creation_input_tokens,
        ),
    )
