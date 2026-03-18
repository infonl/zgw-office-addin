# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

import base64

import pytest
from fastapi.testclient import TestClient

from llm_relay.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def b64_content():
    return base64.b64encode(b"This is a test document about Dutch housing policy.").decode()


@pytest.fixture
def sample_payload(b64_content):
    return {
        "content": b64_content,
        "content_type": "text/plain",
        "prompt": "Summarize this document.",
        "output_schema": {"summary": "str", "topics": "list[str]"},
    }


@pytest.fixture
def mock_settings_attrs():
    """Common mock settings attributes for tests that mock the OpenRouter call."""
    return {
        "openrouter_api_key": "sk-test",
        "default_model": "test-model",
        "llm_temperature": 0.1,
        "llm_max_tokens": 4096,
        "llm_timeout_seconds": 30,
        "app_url": "http://test",
        "app_name": "test",
        "max_content_length": 500_000,
    }
