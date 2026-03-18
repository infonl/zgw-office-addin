# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

# --- builder ---
FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src/ src/

# --- production ---
FROM python:3.12-slim AS production

RUN groupadd -r llmrelay && useradd -r -g llmrelay -d /app llmrelay

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src /app/src

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app/src" \
    PYTHONUNBUFFERED=1

USER llmrelay

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD ["/app/.venv/bin/python", "-c", "import httpx; httpx.get('http://localhost:8080/health').raise_for_status()"]

CMD ["uvicorn", "llm_relay.main:app", "--host", "0.0.0.0", "--port", "8080"]
