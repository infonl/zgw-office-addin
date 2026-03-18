# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

import base64
import json
import logging

import httpx

from llm_relay.config import Settings

logger = logging.getLogger(__name__)

OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"


def _build_messages(prompt: str, decoded_content: str, output_schema: dict) -> list[dict]:
    schema_description = json.dumps(output_schema, indent=2)

    system_prompt = (
        "You are a document analysis assistant. "
        "You will receive a document and a user instruction. "
        "You MUST respond with valid JSON that conforms exactly to the output schema provided. "
        "Do NOT include any text outside the JSON object. No markdown fences, no explanation.\n\n"
        f"Required output schema:\n{schema_description}"
    )

    user_message = f"{prompt}\n\n---\nDOCUMENT:\n{decoded_content}"

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]


async def relay_to_openrouter(
    content_b64: str,
    prompt: str,
    output_schema: dict,
    model: str,
    settings: Settings,
) -> dict:
    try:
        decoded_content = base64.b64decode(content_b64).decode("utf-8")
    except Exception as exc:
        return {"success": False, "error": f"Failed to decode base64 content: {exc}", "data": None, "model_used": None}

    if not settings.openrouter_api_key:
        return {"success": False, "error": "OPENROUTER_API_KEY is not configured", "data": None, "model_used": None}

    messages = _build_messages(prompt, decoded_content, output_schema)

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
        return {"success": False, "error": f"OpenRouter API error {exc.response.status_code}: {body}", "data": None, "model_used": model}
    except httpx.RequestError as exc:
        logger.error("OpenRouter request failed: %s", exc)
        return {"success": False, "error": f"Request failed: {exc}", "data": None, "model_used": model}

    try:
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        parsed = json.loads(content)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.error("Failed to parse OpenRouter response: %s", exc)
        raw = response.text[:500]
        return {"success": False, "error": f"Failed to parse LLM response: {exc}. Raw: {raw}", "data": None, "model_used": model}

    return {"success": True, "data": parsed, "model_used": model, "error": None}
