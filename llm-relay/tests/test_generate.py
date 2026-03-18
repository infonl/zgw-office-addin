# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

import json
from unittest.mock import AsyncMock, patch

import httpx


def test_generate_missing_api_key(client, sample_payload):
    """Without OPENROUTER_API_KEY, returns a clear error."""
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


def test_generate_content_type_is_optional(client, b64_content):
    """content_type can be omitted."""
    payload = {
        "content": b64_content,
        "prompt": "Summarize.",
        "output_schema": {"summary": "str"},
    }
    response = client.post("/api/v1/generate", json=payload)
    assert response.status_code == 200


def _mock_openrouter_response(data: dict) -> httpx.Response:
    body = {"choices": [{"message": {"content": json.dumps(data)}}]}
    return httpx.Response(200, json=body, request=httpx.Request("POST", "https://fake"))


def test_generate_success(client, sample_payload, mock_settings_attrs):
    """Successful round-trip with mocked OpenRouter."""
    llm_data = {"summary": "About housing.", "topics": ["housing", "policy"]}
    mock_response = _mock_openrouter_response(llm_data)

    with (
        patch("llm_relay.main.settings") as mock_settings,
        patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response),
    ):
        for k, v in mock_settings_attrs.items():
            setattr(mock_settings, k, v)

        response = client.post("/api/v1/generate", json=sample_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"] == llm_data
    assert data["error"] is None


def test_generate_with_explicit_model(client, sample_payload, mock_settings_attrs):
    """Explicit model in request is used."""
    sample_payload["model"] = "mistral/mistral-small-2603"
    llm_data = {"summary": "Test.", "topics": ["test"]}
    mock_response = _mock_openrouter_response(llm_data)

    with (
        patch("llm_relay.main.settings") as mock_settings,
        patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response),
    ):
        for k, v in mock_settings_attrs.items():
            setattr(mock_settings, k, v)

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
    response = client.post("/api/v1/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "OPENROUTER_API_KEY" in data["error"]


def test_generate_with_attachment_type(client, sample_payload):
    """attachment_type is accepted without error."""
    sample_payload["attachment_type"] = "item"
    response = client.post("/api/v1/generate", json=sample_payload)
    assert response.status_code == 200


def test_generate_image_content_type(client, mock_settings_attrs):
    """Image content_type uses vision message format."""
    import base64

    # Tiny 1x1 PNG
    pixel = base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"\x00" * 50).decode()
    payload = {
        "content": pixel,
        "content_type": "image/png",
        "prompt": "Describe this image.",
        "output_schema": {"description": "str"},
    }
    llm_data = {"description": "A tiny image."}
    mock_response = _mock_openrouter_response(llm_data)

    with (
        patch("llm_relay.main.settings") as mock_settings,
        patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response) as mock_post,
    ):
        for k, v in mock_settings_attrs.items():
            setattr(mock_settings, k, v)

        response = client.post("/api/v1/generate", json=payload)

    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify the vision message format was used
    call_kwargs = mock_post.call_args
    sent_payload = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
    user_msg = sent_payload["messages"][1]
    assert isinstance(user_msg["content"], list)
    assert user_msg["content"][1]["type"] == "image_url"
    assert "data:image/png;base64," in user_msg["content"][1]["image_url"]["url"]


def test_generate_content_too_large(client, mock_settings_attrs):
    """Content exceeding max size is rejected."""
    mock_settings_attrs["max_content_length"] = 10
    payload = {
        "content": "x" * 100,
        "content_type": "text/plain",
        "prompt": "Summarize.",
        "output_schema": {"summary": "str"},
    }

    with patch("llm_relay.main.settings") as mock_settings:
        for k, v in mock_settings_attrs.items():
            setattr(mock_settings, k, v)
        response = client.post("/api/v1/generate", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "maximum size" in data["error"]


def test_generate_empty_document(client, mock_settings_attrs):
    """Empty document content returns an error, not hallucinated output."""
    import base64
    import io

    import docx as docx_lib

    doc = docx_lib.Document()  # empty doc, no paragraphs
    buf = io.BytesIO()
    doc.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode()

    payload = {
        "content": b64,
        "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "prompt": "Summarize.",
        "output_schema": {"summary": "str"},
    }

    with patch("llm_relay.main.settings") as mock_settings:
        for k, v in mock_settings_attrs.items():
            setattr(mock_settings, k, v)
        response = client.post("/api/v1/generate", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "empty" in data["error"].lower()
