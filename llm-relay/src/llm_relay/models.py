# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

from typing import Any

from pydantic import BaseModel, Field


class RelayRequest(BaseModel):
    content: str = Field(..., description="Base64-encoded document content")
    model: str | None = Field(
        None, description="OpenRouter model ID. Falls back to configured default if not supplied."
    )
    output_schema: dict[str, Any] = Field(
        ..., description="JSON dict describing the desired return type, e.g. {'summary': 'str', 'tags': 'list[str]'}"
    )
    prompt: str = Field(..., description="The prompt/instruction to send to the LLM")


class RelayResponse(BaseModel):
    success: bool
    data: dict[str, Any] | None = None
    model_used: str | None = None
    error: str | None = None
