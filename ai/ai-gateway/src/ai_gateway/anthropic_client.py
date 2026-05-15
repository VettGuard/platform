"""Thin wrapper around AsyncAnthropic with retries, prompt caching, and usage extraction."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from anthropic import AsyncAnthropic
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from .config import Settings, get_settings
from .schemas import ClaudeModel, TokenUsage


@lru_cache(maxsize=1)
def get_client() -> AsyncAnthropic:
    settings = get_settings()
    return AsyncAnthropic(
        api_key=settings.anthropic_api_key,
        timeout=settings.anthropic_timeout_seconds,
        max_retries=0,  # we handle retries with tenacity
    )


def _build_system_blocks(system_prompt: str, *, cache: bool) -> list[dict[str, Any]]:
    """Build the `system` parameter array with optional ephemeral cache control.

    Cache TTL is 1 hour by default. Marking a system block as `ephemeral` makes
    Anthropic store/reuse the prefix across requests; subsequent calls with the
    same prefix get a cache hit, drastically reducing input-token cost.
    """
    block: dict[str, Any] = {"type": "text", "text": system_prompt}
    if cache:
        block["cache_control"] = {"type": "ephemeral"}
    return [block]


async def complete(
    *,
    model: ClaudeModel,
    system_prompt: str,
    user_message: str,
    max_tokens: int = 1024,
    cache_system: bool = True,
    extra: dict[str, Any] | None = None,
) -> tuple[str, TokenUsage]:
    """Run a single-turn completion. Returns (text, usage)."""
    settings: Settings = get_settings()
    client = get_client()

    request_body: dict[str, Any] = {
        "model": model.value,
        "max_tokens": max_tokens,
        "system": _build_system_blocks(
            system_prompt, cache=cache_system and settings.prompt_cache_enabled
        ),
        "messages": [{"role": "user", "content": user_message}],
        **(extra or {}),
    }

    last_response: Any = None
    async for attempt in AsyncRetrying(
        stop=stop_after_attempt(settings.anthropic_max_retries),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=8),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    ):
        with attempt:
            last_response = await client.messages.create(**request_body)

    response = last_response
    text_parts: list[str] = []
    for block in response.content:
        if getattr(block, "type", None) == "text":
            text_parts.append(block.text)

    usage = TokenUsage(
        input_tokens=getattr(response.usage, "input_tokens", 0),
        output_tokens=getattr(response.usage, "output_tokens", 0),
        cache_read_input_tokens=getattr(response.usage, "cache_read_input_tokens", 0) or 0,
        cache_creation_input_tokens=getattr(response.usage, "cache_creation_input_tokens", 0) or 0,
    )
    return "".join(text_parts), usage
