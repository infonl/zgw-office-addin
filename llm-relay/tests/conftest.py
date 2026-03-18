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
        "prompt": "Summarize this document.",
        "output_schema": {"summary": "str", "topics": "list[str]"},
    }
