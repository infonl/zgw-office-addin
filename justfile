# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

# List available recipes
default:
    @just --list

# --- Docker Compose (all services) ---

# Start all default services
up:
    docker compose up -d

# Start all default services + LLM relay
up-all:
    docker compose --profile llm up -d

# Stop all services
down:
    docker compose --profile llm down

# View logs (all services)
logs *ARGS:
    docker compose --profile llm logs {{ ARGS }}

# --- LLM Relay ---

# Start only the LLM relay service
relay-up:
    docker compose --profile llm up -d llm-relay

# Rebuild and start the LLM relay service
relay-rebuild:
    docker compose --profile llm up -d --build llm-relay

# View LLM relay logs
relay-logs:
    docker compose --profile llm logs -f llm-relay

# Run LLM relay locally (without Docker)
relay-dev:
    cd llm-relay && uv run uvicorn llm_relay.main:app --host 0.0.0.0 --port 8080 --reload

# Install LLM relay dependencies locally
relay-install:
    cd llm-relay && uv sync --extra dev

# Format and lint all Python code
fmt:
    cd llm-relay && uv run ruff format src && uv run ruff check --fix src

# Test the generate endpoint. Pass a JSON file as arg, or omit for default sample.
relay-test-request PAYLOAD="":
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -n "{{ PAYLOAD }}" ]; then
        curl -s -X POST http://localhost:8080/api/v1/generate \
          -H "Content-Type: application/json" \
          -d @"{{ PAYLOAD }}" | python3 -m json.tool
    else
        CONTENT=$(echo "This is a test document about climate change policies in the Netherlands. The government has committed to reducing greenhouse gas emissions by 49% by 2030." | base64 | tr -d '\n')
        curl -s -X POST http://localhost:8080/api/v1/generate \
          -H "Content-Type: application/json" \
          -d "{\"content\": \"${CONTENT}\", \"prompt\": \"Summarize this document and extract key topics.\", \"output_schema\": {\"summary\": \"str\", \"topics\": \"list[str]\", \"language\": \"str\"}}" | python3 -m json.tool
    fi
