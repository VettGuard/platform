"""POST /v1/ai/echo — round-trip smoke test against Claude."""

from __future__ import annotations

from fastapi import APIRouter

from ..anthropic_client import complete
from ..logging import get_logger
from ..prompts import echo as echo_prompt
from ..schemas import EchoRequest, EchoResponse

router = APIRouter(prefix="/v1/ai", tags=["ai"])
log = get_logger(__name__)


@router.post("/echo", response_model=EchoResponse)
async def echo(req: EchoRequest) -> EchoResponse:
    text, usage = await complete(
        model=req.model,
        system_prompt=echo_prompt.PROMPT,
        user_message=req.message,
        max_tokens=512,
        cache_system=True,
    )
    log.info(
        "echo.complete",
        tenant_id=req.ctx.tenant_id,
        model=req.model.value,
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
        cache_read=usage.cache_read_input_tokens,
    )
    return EchoResponse(reply=text, usage=usage, trace_id=req.ctx.trace_id)
