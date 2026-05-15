"""Shared pytest fixtures."""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest


@pytest.fixture(autouse=True)
def fake_env() -> Iterator[None]:
    """Provide a sane env so Settings() succeeds without a real API key."""
    saved = {
        "ANTHROPIC_API_KEY": os.environ.get("ANTHROPIC_API_KEY"),
        "ENVIRONMENT": os.environ.get("ENVIRONMENT"),
    }
    os.environ["ANTHROPIC_API_KEY"] = "sk-ant-test"
    os.environ["ENVIRONMENT"] = "development"
    yield
    for k, v in saved.items():
        if v is None:
            os.environ.pop(k, None)
        else:
            os.environ[k] = v
