"""Unit tests for the per-tenant token budget tracker."""

from __future__ import annotations

import pytest

from ai_gateway.budget import TokenBudget


@pytest.mark.asyncio
async def test_check_allows_under_limit() -> None:
    b = TokenBudget(daily_limit=100)
    allowed, remaining = await b.check("t1")
    assert allowed
    assert remaining == 100


@pytest.mark.asyncio
async def test_charge_then_reject() -> None:
    b = TokenBudget(daily_limit=10)
    await b.charge("t1", 7)
    allowed, remaining = await b.check("t1")
    assert allowed
    assert remaining == 3

    await b.charge("t1", 3)
    allowed, remaining = await b.check("t1")
    assert not allowed
    assert remaining == 0


@pytest.mark.asyncio
async def test_isolation_between_tenants() -> None:
    b = TokenBudget(daily_limit=5)
    await b.charge("t1", 5)
    allowed_t1, _ = await b.check("t1")
    allowed_t2, _ = await b.check("t2")
    assert not allowed_t1
    assert allowed_t2


@pytest.mark.asyncio
async def test_day_rollover() -> None:
    b = TokenBudget(daily_limit=5)
    await b.charge("t1", 5)
    # Simulate a new day by mutating the day stamp directly.
    b._by_tenant["t1"].day = "1999-01-01"
    allowed, remaining = await b.check("t1")
    assert allowed
    assert remaining == 5
