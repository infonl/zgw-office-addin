# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

from typing import Any

from pydantic import BaseModel, Field, field_validator


class RelayRequest(BaseModel):
    content: str = Field(
        ...,
        description="Base64-encoded document content (or plain text)",
        json_schema_extra={"example": "RGl0IGlzIGVlbiB0ZXN0IGRvY3VtZW50Lg=="},
    )
    content_type: str | None = Field(
        None,
        description=(
            "MIME type of the content, e.g. 'application/vnd.openxmlformats-"
            "officedocument.wordprocessingml.document', 'image/png', 'message/rfc822'."
        ),
        json_schema_extra={"example": "text/plain"},
    )
    attachment_type: str | None = Field(
        None,
        description=(
            "Type of attachment: 'file' (standalone document or email attachment) "
            "or 'item' (email message). Passed as context to the LLM."
        ),
        json_schema_extra={"example": "file"},
    )
    model: str | None = Field(
        None,
        description="OpenRouter model ID. Defaults to server config if omitted.",
        json_schema_extra={"example": "mistralai/mistral-small-3.2-24b-instruct-2506"},
    )

    @field_validator("model")
    @classmethod
    def normalize_model_id(cls, v: str | None) -> str | None:
        """Treat invalid model IDs as 'not specified' so the server default is used."""
        if v is not None and "/" not in v:
            return None
        return v

    output_schema: dict[str, Any] = Field(
        default={"beschrijving": "str"},
        description="JSON dict describing the desired return type, e.g. {'summary': 'str', 'tags': 'list[str]'}",
    )
    prompt: str = Field(
        ...,
        description="The prompt/instruction to send to the LLM",
        json_schema_extra={"example": "Beschrijf dit document."},
    )


class RelayResponse(BaseModel):
    success: bool
    data: dict[str, Any] | None = None
    model_used: str | None = None
    error: str | None = None
