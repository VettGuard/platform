# Build context: monorepo root
# Build: `docker build -f ai/ai-gateway/Dockerfile -t vettguard/ai-gateway .`
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN pip install --no-cache-dir uv

WORKDIR /workspace
COPY ai/ai-gateway/pyproject.toml ai/ai-gateway/
WORKDIR /workspace/ai/ai-gateway
RUN uv pip install --system --no-cache .

COPY ai/ai-gateway/src ./src

# ─── Runtime ────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

RUN useradd --create-home --shell /bin/bash app
WORKDIR /home/app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /workspace/ai/ai-gateway/src ./src

USER app
EXPOSE 8090
ENV PYTHONPATH=/home/app/src
CMD ["uvicorn", "ai_gateway.main:app", "--host", "0.0.0.0", "--port", "8090"]
