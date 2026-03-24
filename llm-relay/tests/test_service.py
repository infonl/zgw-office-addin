# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

from llm_relay.service import _build_system_prompt, _build_text_messages, _build_vision_messages


def test_build_system_prompt_includes_schema():
    schema = {"summary": "str", "tags": "list[str]"}
    prompt = _build_system_prompt(schema)
    assert "JSON" in prompt
    assert '"summary"' in prompt
    assert '"tags"' in prompt


def test_build_system_prompt_instructs_dutch_output():
    """LLM is instructed to formulate response values in Dutch for end users."""
    prompt = _build_system_prompt({"beschrijving": "str"})
    assert "Dutch" in prompt
    assert "Nederlands" in prompt


def test_build_text_messages_structure():
    messages = _build_text_messages(
        prompt="Summarize this.",
        text_content="Some document text.",
        output_schema={"summary": "str"},
        attachment_type=None,
    )
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    assert "Summarize this." in messages[1]["content"]
    assert "Some document text." in messages[1]["content"]


def test_build_text_messages_email_context():
    messages = _build_text_messages(
        prompt="Extract sender.",
        text_content="From: test@example.com",
        output_schema={"sender": "str"},
        attachment_type="item",
    )
    assert "email message" in messages[1]["content"].lower()


def test_build_text_messages_file_context():
    messages = _build_text_messages(
        prompt="Summarize.",
        text_content="Some content.",
        output_schema={"summary": "str"},
        attachment_type="file",
    )
    assert "file attachment" in messages[1]["content"].lower()


def test_build_text_messages_no_context_when_none():
    messages = _build_text_messages(
        prompt="Summarize.",
        text_content="Some content.",
        output_schema={"summary": "str"},
        attachment_type=None,
    )
    user_msg = messages[1]["content"]
    assert "email" not in user_msg.lower()
    assert "attachment" not in user_msg.lower()


def test_build_text_messages_document_separated_from_prompt():
    messages = _build_text_messages(
        prompt="Extract topics.",
        text_content="Content here.",
        output_schema={"topics": "list[str]"},
        attachment_type=None,
    )
    user_msg = messages[1]["content"]
    prompt_pos = user_msg.index("Extract topics.")
    separator_pos = user_msg.index("---")
    content_pos = user_msg.index("Content here.")
    assert prompt_pos < separator_pos < content_pos


def test_build_vision_messages_structure():
    messages = _build_vision_messages(
        prompt="Describe this image.",
        image_b64="abc123",
        content_type="image/png",
        output_schema={"description": "str"},
    )
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    # User message is a list of content parts for vision
    user_content = messages[1]["content"]
    assert isinstance(user_content, list)
    assert len(user_content) == 2
    assert user_content[0]["type"] == "text"
    assert "Describe this image." in user_content[0]["text"]
    assert user_content[1]["type"] == "image_url"
    assert user_content[1]["image_url"]["url"] == "data:image/png;base64,abc123"


def test_build_vision_messages_jpeg():
    messages = _build_vision_messages(
        prompt="Analyze.",
        image_b64="xyz789",
        content_type="image/jpeg",
        output_schema={"analysis": "str"},
    )
    url = messages[1]["content"][1]["image_url"]["url"]
    assert url.startswith("data:image/jpeg;base64,")


def test_build_vision_messages_reinforces_json_instruction():
    messages = _build_vision_messages(
        prompt="Describe this.",
        image_b64="abc",
        content_type="image/png",
        output_schema={"description": "str"},
    )
    text_part = messages[1]["content"][0]["text"]
    assert "JSON" in text_part
    assert "Describe this." in text_part
