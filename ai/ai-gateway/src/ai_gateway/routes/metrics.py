"""GET /metrics — Prometheus exposition endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Response

from .. import metrics

router = APIRouter(tags=["ops"])


@router.get("/metrics", include_in_schema=False)
async def prometheus_metrics() -> Response:
    payload, content_type = metrics.render()
    return Response(content=payload, media_type=content_type)
