"""Parse-path tests for /v1/ai/score-broker.

We don't hit the real Anthropic API here — the goal is to cover the
fragile glue: JSON extraction (with/without code fences), clamp logic,
and the always-valid fallback when the model returns garbage.
"""

from __future__ import annotations

import json

from ai_gateway.routes.score_broker import _FALLBACK, _clamp_score, _parse_payload, _status_for
from ai_gateway.schemas import BrokerStatus


def test_parse_plain_json() -> None:
    raw = json.dumps(
        {
            "score": 82,
            "verdict": "Book confidently",
            "status": "active",
            "pay_days": 19,
            "reasons": ["Pay speed 19d", "No bond claims"],
            "confidence": 0.86,
        }
    )
    parsed = _parse_payload(raw)
    assert parsed["score"] == 82
    assert parsed["status"] == "active"


def test_parse_json_with_code_fence() -> None:
    raw = "```json\n" + json.dumps({"score": 41, "status": "blocked"}) + "\n```"
    parsed = _parse_payload(raw)
    assert parsed["score"] == 41
    assert parsed["status"] == "blocked"


def test_parse_garbage_returns_fallback() -> None:
    parsed = _parse_payload("I'm sorry I can't help with that")
    assert parsed == _FALLBACK


def test_clamp_score() -> None:
    assert _clamp_score(-5) == 0
    assert _clamp_score(150) == 100
    assert _clamp_score(73) == 73


def test_status_for_thresholds() -> None:
    assert _status_for(95) == BrokerStatus.PREFERRED
    assert _status_for(85) == BrokerStatus.PREFERRED
    assert _status_for(84) == BrokerStatus.ACTIVE
    assert _status_for(70) == BrokerStatus.ACTIVE
    assert _status_for(50) == BrokerStatus.WATCH
    assert _status_for(49) == BrokerStatus.BLOCKED
    assert _status_for(0) == BrokerStatus.BLOCKED
