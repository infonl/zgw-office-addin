# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

import base64

from llm_relay.service import _build_messages, _decode_content


def test_decode_content_valid_base64():
    original = "Hello, world!"
    encoded = base64.b64encode(original.encode()).decode()
    decoded, was_base64 = _decode_content(encoded)
    assert was_base64 is True
    assert decoded == original


def test_decode_content_plain_text():
    plain = "This is not base64 at all."
    decoded, was_base64 = _decode_content(plain)
    assert was_base64 is False
    assert decoded == plain


def test_decode_content_empty_string():
    decoded, was_base64 = _decode_content("")
    assert decoded == ""


def test_build_messages_includes_schema():
    messages = _build_messages(
        prompt="Summarize this.",
        decoded_content="Some document text.",
        output_schema={"summary": "str", "tags": "list[str]"},
    )
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"

    # System prompt contains the schema
    assert '"summary"' in messages[0]["content"]
    assert '"tags"' in messages[0]["content"]
    assert "JSON" in messages[0]["content"]

    # User message contains prompt and document
    assert "Summarize this." in messages[1]["content"]
    assert "Some document text." in messages[1]["content"]
    assert "DOCUMENT:" in messages[1]["content"]


def test_build_messages_document_separated_from_prompt():
    messages = _build_messages(
        prompt="Extract topics.",
        decoded_content="Content here.",
        output_schema={"topics": "list[str]"},
    )
    user_msg = messages[1]["content"]
    # Prompt comes before the separator
    prompt_pos = user_msg.index("Extract topics.")
    separator_pos = user_msg.index("---")
    content_pos = user_msg.index("Content here.")
    assert prompt_pos < separator_pos < content_pos
