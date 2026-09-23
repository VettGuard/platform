"""Per-tenant daily token budget.

Process-local accounting backed by a ``dict[tenant_id, day_state]`` and an
``asyncio.Lock``. Good enough for Sprint 2 with a single ai-gateway replica.
When we scale out, swap this for a Redis ``INCRBY`` with an EXPIRE at the day
boundary — the call sites won't change.

Charge model: callers post-call by passing the total tokens billed
(``input + cache_read + cache_creation + output``). Pre-flight enforcement
uses ``check`` to reject before the upstream call is made.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class _DayState:
    day: str  # YYYY-MM-DD UTC
    used: int = 0


@dataclass
class TokenBudget:
    """In-memory budget tracker. Singleton per process."""

    daily_limit: int
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, init=False, repr=False)
    _by_tenant: dict[str, _DayState] = field(default_factory=dict, init=False, repr=False)

    @staticmethod
    def _today() -> str:
        return datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")

    async def check(self, tenant_id: str) -> tuple[bool, int]:
        """Return ``(allowed, remaining)`` without consuming budget."""
        async with self._lock:
            state = self._rollover(tenant_id)
            remaining = max(0, self.daily_limit - state.used)
            return state.used < self.daily_limit, remaining

    async def charge(self, tenant_id: str, tokens: int) -> int:
        """Record token usage. Returns the new total for the day."""
        async with self._lock:
            state = self._rollover(tenant_id)
            state.used += tokens
            return state.used

    def _rollover(self, tenant_id: str) -> _DayState:
        today = self._today()
        state = self._by_tenant.get(tenant_id)
        if state is None or state.day != today:
            state = _DayState(day=today)
            self._by_tenant[tenant_id] = state
        return state


_singleton: TokenBudget | None = None


def get_budget(daily_limit: int) -> TokenBudget:
    """Return the process-wide budget instance. Lazy-init from settings."""
    global _singleton
    if _singleton is None or _singleton.daily_limit != daily_limit:
        _singleton = TokenBudget(daily_limit=daily_limit)
    return _singleton
