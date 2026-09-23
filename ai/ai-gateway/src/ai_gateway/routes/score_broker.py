"""POST /v1/ai/score-broker — risk-score one broker.

The handler asks Claude for a JSON object matching ScoreBrokerResponse,
parses it, and clamps the fields to safe ranges before returning. If
the model produces non-JSON (rare, but the prompt explicitly forbids
markdown), we fall back to a neutral "watch" verdict so the caller
always gets a valid response — failing closed in the Phase-1 product
would mean the dashboard never shows a chip, which is strictly worse
than a low-confidence fallback.
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
from ..prompts import score_broker as score_broker_prompt
from ..schemas import (
    BrokerStatus,
    ScoreBrokerRequest,
    ScoreBrokerResponse,
    TokenUsage,
)

router = APIRouter(prefix="/v1/ai", tags=["ai"])
log = get_logger(__name__)

# Conservative fallback when the model returns something we can't parse.
# Same shape as a real response so the caller doesn't branch.
_FALLBACK: dict[str, Any] = {
    "score": 65,
    "verdict": "Watch closely",
    "status": "watch",
    "pay_days": 30,
    "reasons": ["AI parse error — defaulting to neutral score"],
    "confidence": 0.1,
}


def _build_user_message(req: ScoreBrokerRequest) -> str:
    parts: list[str] = [f"MC number: {req.mc}"]
    if req.name:
        parts.append(f"Name: {req.name}")
    if req.city:
        parts.append(f"HQ: {req.city}")
    if req.signals:
        parts.append(f"Signals:\n{req.signals}")
    else:
        parts.append("Signals: (none — score from MC pattern + general knowledge)")
    return "\n".join(parts)


def _clamp_score(v: int) -> int:
    return max(0, min(100, int(v)))


def _status_for(score: int) -> BrokerStatus:
    if score >= 85:
        return BrokerStatus.PREFERRED
    if score >= 70:
        return BrokerStatus.ACTIVE
    if score >= 50:
        return BrokerStatus.WATCH
    return BrokerStatus.BLOCKED


def _parse_payload(text: str) -> dict[str, Any]:
    """Pull a JSON object out of the model reply. Tolerates a leading
    ```json fence even though the prompt forbids it (defense in depth)."""
    s = text.strip()
    if s.startswith("```"):
        # Strip the first line (```json or ```) and the closing fence.
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


@router.post("/score-broker", response_model=ScoreBrokerResponse)
async def score_broker(req: ScoreBrokerRequest) -> ScoreBrokerResponse:
    settings = get_settings()
    budget = get_budget(settings.daily_tenant_token_budget)

    allowed, remaining = await budget.check(req.ctx.tenant_id)
    if not allowed:
        budget_rejections_total.labels(tenant_id=req.ctx.tenant_id).inc()
        requests_total.labels(
            route="score_broker", model=req.model.value, outcome="budget"
        ).inc()
        raise HTTPException(status_code=429, detail="daily token budget exhausted")

    started = time.perf_counter()
    try:
        text, usage = await complete(
            model=req.model,
            system_prompt=score_broker_prompt.PROMPT,
            user_message=_build_user_message(req),
            max_tokens=400,
            cache_system=True,
        )
    except Exception:
        requests_total.labels(
            route="score_broker", model=req.model.value, outcome="error"
        ).inc()
        raise
    finally:
        request_latency_seconds.labels(
            route="score_broker", model=req.model.value
        ).observe(time.perf_counter() - started)

    payload = _parse_payload(text)

    score = _clamp_score(payload.get("score", 65))
    # Status: trust the model unless it gave us garbage; fall back to score-derived.
    status_raw = str(payload.get("status", "")).lower()
    try:
        status = BrokerStatus(status_raw)
    except ValueError:
        status = _status_for(score)

    pay_days_raw = payload.get("pay_days", 30)
    try:
        pay_days = max(0, min(365, int(pay_days_raw)))
    except (TypeError, ValueError):
        pay_days = 30

    confidence_raw = payload.get("confidence", 0.5)
    try:
        confidence = max(0.0, min(1.0, float(confidence_raw)))
    except (TypeError, ValueError):
        confidence = 0.5

    reasons = payload.get("reasons", [])
    if not isinstance(reasons, list):
        reasons = [str(reasons)]
    # Trim each reason to keep responses small for the dashboard chip.
    reasons = [str(r)[:120] for r in reasons[:6]]

    verdict = str(payload.get("verdict", "Watch closely"))[:80]

    labels = {
        "tenant_id": req.ctx.tenant_id,
        "model": req.model.value,
        "route": "score_broker",
    }
    tokens_input_total.labels(**labels).inc(usage.input_tokens)
    tokens_output_total.labels(**labels).inc(usage.output_tokens)
    tokens_cache_read_total.labels(**labels).inc(usage.cache_read_input_tokens)
    tokens_cache_creation_total.labels(**labels).inc(usage.cache_creation_input_tokens)
    requests_total.labels(
        route="score_broker", model=req.model.value, outcome="ok"
    ).inc()

    total_billable = (
        usage.input_tokens
        + usage.cache_creation_input_tokens
        + usage.cache_read_input_tokens
        + usage.output_tokens
    )
    await budget.charge(req.ctx.tenant_id, total_billable)

    log.info(
        "score_broker.complete",
        tenant_id=req.ctx.tenant_id,
        mc=req.mc,
        score=score,
        status=status.value,
        budget_remaining_pre=remaining,
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
    )

    return ScoreBrokerResponse(
        score=score,
        verdict=verdict,
        status=status,
        pay_days=pay_days,
        reasons=reasons,
        confidence=confidence,
        usage=TokenUsage(
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            cache_read_input_tokens=usage.cache_read_input_tokens,
            cache_creation_input_tokens=usage.cache_creation_input_tokens,
        ),
    )
