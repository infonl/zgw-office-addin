# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

import json
from unittest.mock import AsyncMock, patch

import httpx


def test_generate_missing_api_key(client, sample_payload):
    """Without OPENROUTER_API_KEY, returns a clear error."""
    with patch("llm_relay.service.Settings") as mock:
        # The actual settings object used by the endpoint has openrouter_api_key=""
        response = client.post("/api/v1/generate", json=sample_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "OPENROUTER_API_KEY" in data["error"]


def test_generate_validation_missing_content(client):
    """Missing required fields returns 422."""
    response = client.post("/api/v1/generate", json={"prompt": "hello"})
    assert response.status_code == 422


def test_generate_validation_missing_prompt(client, b64_content):
    """Missing prompt returns 422."""
    response = client.post(
        "/api/v1/generate",
        json={"content": b64_content, "output_schema": {"summary": "str"}},
    )
    assert response.status_code == 422


def test_generate_validation_missing_output_schema(client, b64_content):
    """Missing output_schema returns 422."""
    response = client.post(
        "/api/v1/generate",
        json={"content": b64_content, "prompt": "Summarize."},
    )
    assert response.status_code == 422


def test_generate_model_is_optional(client, sample_payload):
    """model field can be omitted — should not cause 422."""
    assert "model" not in sample_payload
    response = client.post("/api/v1/generate", json=sample_payload)
    # Will fail at API key check, but not at validation
    assert response.status_code == 200


def _mock_openrouter_response(data: dict) -> httpx.Response:
    body = {"choices": [{"message": {"content": json.dumps(data)}}]}
    return httpx.Response(200, json=body, request=httpx.Request("POST", "https://fake"))


def test_generate_success(client, sample_payload):
    """Successful round-trip with mocked OpenRouter."""
    llm_data = {"summary": "About housing.", "topics": ["housing", "policy"]}
    mock_response = _mock_openrouter_response(llm_data)

    with (
        patch("llm_relay.main.settings") as mock_settings,
        patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response),
    ):
        mock_settings.openrouter_api_key = "sk-test"
        mock_settings.default_model = "test-model"
        mock_settings.llm_temperature = 0.1
        mock_settings.llm_max_tokens = 4096
        mock_settings.llm_timeout_seconds = 30
        mock_settings.app_url = "http://test"
        mock_settings.app_name = "test"

        response = client.post("/api/v1/generate", json=sample_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"] == llm_data
    assert data["error"] is None


def test_generate_with_explicit_model(client, sample_payload):
    """Explicit model in request is used."""
    sample_payload["model"] = "mistralai/mistral-large-latest"
    llm_data = {"summary": "Test.", "topics": ["test"]}
    mock_response = _mock_openrouter_response(llm_data)

    with (
        patch("llm_relay.main.settings") as mock_settings,
        patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response),
    ):
        mock_settings.openrouter_api_key = "sk-test"
        mock_settings.default_model = "default-model"
        mock_settings.llm_temperature = 0.1
        mock_settings.llm_max_tokens = 4096
        mock_settings.llm_timeout_seconds = 30
        mock_settings.app_url = "http://test"
        mock_settings.app_name = "test"

        response = client.post("/api/v1/generate", json=sample_payload)

    assert response.status_code == 200
    assert response.json()["success"] is True


def test_generate_plain_text_content(client):
    """Plain text (not base64) is accepted as fallback."""
    payload = {
        "content": "This is plain text, not base64 encoded.",
        "prompt": "Summarize.",
        "output_schema": {"summary": "str"},
    }
    # Will fail at API key check, but content decoding should not error
    response = client.post("/api/v1/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "OPENROUTER_API_KEY" in data["error"]
