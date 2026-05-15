"""Configuration loaded from environment variables."""

from __future__ import annotations

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Service settings. Override via env vars or .env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    service_name: str = "ai-gateway"
    environment: Literal["development", "staging", "production"] = "development"
    http_port: int = 8090
    log_level: Literal["debug", "info", "warning", "error"] = "info"

    # ── Anthropic ───────────────────────────────────────────────────────
    anthropic_api_key: str
    anthropic_default_model: str = "claude-sonnet-4-6"
    anthropic_fast_model: str = "claude-haiku-4-5"
    anthropic_hard_model: str = "claude-opus-4-7"
    anthropic_max_retries: int = 3
    anthropic_timeout_seconds: float = 60.0

    # ── Prompt cache ────────────────────────────────────────────────────
    prompt_cache_enabled: bool = True

    # ── OpenTelemetry ───────────────────────────────────────────────────
    otel_exporter_otlp_endpoint: str | None = None

    # ── Tenant token quotas (cents-style daily budget) ──────────────────
    daily_tenant_token_budget: int = 1_000_000


def get_settings() -> Settings:
    """Return a singleton-style settings object. Cached by FastAPI dependency."""
    return Settings()  # type: ignore[call-arg]
