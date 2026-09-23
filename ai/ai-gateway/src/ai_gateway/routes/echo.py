"""POST /v1/ai/echo — round-trip smoke test against Claude."""

from __future__ import annotations

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
from ..prompts import echo as echo_prompt
from ..schemas import EchoRequest, EchoResponse

router = APIRouter(prefix="/v1/ai", tags=["ai"])
log = get_logger(__name__)


@router.post("/echo", response_model=EchoResponse)
async def echo(req: EchoRequest) -> EchoResponse:
    settings = get_settings()
    budget = get_budget(settings.daily_tenant_token_budget)

    allowed, remaining = await budget.check(req.ctx.tenant_id)
    if not allowed:
        budget_rejections_total.labels(tenant_id=req.ctx.tenant_id).inc()
        requests_total.labels(route="echo", model=req.model.value, outcome="budget").inc()
        raise HTTPException(status_code=429, detail="daily token budget exhausted")

    started = time.perf_counter()
    try:
        text, usage = await complete(
            model=req.model,
            system_prompt=echo_prompt.PROMPT,
            user_message=req.message,
            max_tokens=512,
            cache_system=True,
        )
    except Exception:
        requests_total.labels(route="echo", model=req.model.value, outcome="error").inc()
        raise
    finally:
        request_latency_seconds.labels(route="echo", model=req.model.value).observe(
            time.perf_counter() - started
        )

    labels = {"tenant_id": req.ctx.tenant_id, "model": req.model.value, "route": "echo"}
    tokens_input_total.labels(**labels).inc(usage.input_tokens)
    tokens_output_total.labels(**labels).inc(usage.output_tokens)
    tokens_cache_read_total.labels(**labels).inc(usage.cache_read_input_tokens)
    tokens_cache_creation_total.labels(**labels).inc(usage.cache_creation_input_tokens)
    requests_total.labels(route="echo", model=req.model.value, outcome="ok").inc()

    total_billable = (
        usage.input_tokens
        + usage.cache_creation_input_tokens
        + usage.cache_read_input_tokens
        + usage.output_tokens
    )
    await budget.charge(req.ctx.tenant_id, total_billable)

    log.info(
        "echo.complete",
        tenant_id=req.ctx.tenant_id,
        model=req.model.value,
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
        cache_read=usage.cache_read_input_tokens,
        budget_remaining_pre=remaining,
    )
    return EchoResponse(reply=text, usage=usage, trace_id=req.ctx.trace_id)
