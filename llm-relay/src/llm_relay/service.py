# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

import json
import logging

import httpx

from llm_relay.config import Settings
from llm_relay.extractor import extract_text, is_image

logger = logging.getLogger(__name__)

OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"


def _build_system_prompt(output_schema: dict) -> str:
    schema_description = json.dumps(output_schema, indent=2)
    return (
        "You are a document analysis assistant. "
        "You will receive a document and a user instruction. "
        "You MUST respond with valid JSON that conforms exactly to the output schema provided. "
        "Do NOT include any text outside the JSON object. No markdown fences, no explanation.\n\n"
        f"Required output schema:\n{schema_description}"
    )


def _build_text_messages(
    prompt: str, text_content: str, output_schema: dict, attachment_type: str | None
) -> list[dict]:
    system_prompt = _build_system_prompt(output_schema)

    context_hint = ""
    if attachment_type == "item":
        context_hint = "This is an email message.\n\n"
    elif attachment_type == "file":
        context_hint = "This is a file attachment.\n\n"

    user_message = f"{prompt}\n\n---\n{context_hint}DOCUMENT:\n{text_content}"

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]


def _build_vision_messages(prompt: str, image_b64: str, content_type: str, output_schema: dict) -> list[dict]:
    system_prompt = _build_system_prompt(output_schema)

    user_content = [
        {"type": "text", "text": f"{prompt}\n\nRespond with JSON matching the required output schema."},
        {
            "type": "image_url",
            "image_url": {"url": f"data:{content_type};base64,{image_b64}"},
        },
    ]

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]


def _error(msg: str, model: str | None = None) -> dict:
    return {"success": False, "error": msg, "data": None, "model_used": model}


async def relay_to_openrouter(
    content: str,
    content_type: str | None,
    attachment_type: str | None,
    prompt: str,
    output_schema: dict,
    model: str,
    settings: Settings,
) -> dict:
    if len(content) > settings.max_content_length:
        return _error(f"Content exceeds maximum size of {settings.max_content_length} characters", model)

    if not settings.openrouter_api_key:
        return _error("OPENROUTER_API_KEY is not configured")

    # Route by content type: images go via vision API, everything else gets text extracted
    if is_image(content_type):
        messages = _build_vision_messages(prompt, content, content_type, output_schema)
    else:
        try:
            text_content = extract_text(content, content_type)
        except Exception as exc:
            logger.error("Failed to extract text from content_type=%s: %s", content_type, exc)
            return _error(f"Failed to extract text from document: {exc}", model)
        if not text_content.strip():
            return _error("Document appears to be empty or contains no extractable text", model)
        messages = _build_text_messages(prompt, text_content, output_schema, attachment_type)

    payload = {
        "model": model,
        "messages": messages,
        "temperature": settings.llm_temperature,
        "max_tokens": settings.llm_max_tokens,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": settings.app_url,
        "X-Title": settings.app_name,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            response = await client.post(OPENROUTER_CHAT_URL, json=payload, headers=headers)
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        body = exc.response.text
        logger.error("OpenRouter API error: %s %s", exc.response.status_code, body)
        return _error(f"OpenRouter API error {exc.response.status_code}: {body}", model)
    except httpx.TimeoutException:
        logger.error("OpenRouter request timed out after %ss", settings.llm_timeout_seconds)
        return _error(f"LLM request timed out after {settings.llm_timeout_seconds}s", model)
    except httpx.RequestError as exc:
        logger.error("OpenRouter request failed: %s", exc)
        return _error(f"Request failed: {exc}", model)

    try:
        result = response.json()
        llm_content = result["choices"][0]["message"]["content"]
        parsed = json.loads(llm_content)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.error("Failed to parse OpenRouter response: %s", exc)
        raw = response.text[:500]
        return _error(f"Failed to parse LLM response: {exc}. Raw: {raw}", model)

    expected_keys = set(output_schema.keys())
    actual_keys = set(parsed.keys())
    missing = expected_keys - actual_keys
    if missing:
        logger.warning("LLM response missing expected schema keys: %s", missing)

    return {"success": True, "data": parsed, "model_used": model, "error": None}
