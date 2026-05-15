"""Health probe smoke tests."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_healthz_alive() -> None:
    from ai_gateway.main import create_app

    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"status": "alive"}


@pytest.mark.asyncio
async def test_readyz_ready() -> None:
    from ai_gateway.main import create_app

    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/readyz")
    assert res.status_code == 200
    assert res.json() == {"status": "ready"}
