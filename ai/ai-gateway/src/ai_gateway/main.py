"""FastAPI application entrypoint."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from .config import get_settings
from .logging import configure_logging, get_logger
from .routes import classify, echo, health


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:  # noqa: ARG001
    settings = get_settings()
    configure_logging(settings.log_level, settings.environment)
    log = get_logger()
    log.info("ai-gateway.startup", env=settings.environment, port=settings.http_port)
    yield
    log.info("ai-gateway.shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="VettGuard AI Gateway",
        description="Routes structured tasks to Claude.",
        version="0.0.0",
        lifespan=lifespan,
    )
    app.include_router(health.router)
    app.include_router(echo.router)
    app.include_router(classify.router)
    return app


app = create_app()
