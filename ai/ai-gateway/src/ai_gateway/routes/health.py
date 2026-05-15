"""Liveness + readiness probes."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("/healthz", tags=["health"])
async def live() -> dict[str, str]:
    return {"status": "alive"}


@router.get("/readyz", tags=["health"])
async def ready() -> dict[str, str]:
    # Phase 2: probe Anthropic API + downstream deps.
    return {"status": "ready"}
