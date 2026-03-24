# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from llm_relay.config import get_settings
from llm_relay.models import RelayRequest, RelayResponse
from llm_relay.service import relay_to_openrouter

settings = get_settings()

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))

app = FastAPI(title="LLM Relay", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "llm-relay"}


@app.post("/api/v1/generate", response_model=RelayResponse)
async def generate(request: RelayRequest):
    model = request.model or settings.default_model

    result = await relay_to_openrouter(
        content=request.content,
        content_type=request.content_type,
        attachment_type=request.attachment_type,
        prompt=request.prompt,
        output_schema=request.output_schema,
        model=model,
        settings=settings,
    )

    http_status = result.pop("http_status", 200)
    response = RelayResponse(**result)
    if not response.success:
        return JSONResponse(status_code=http_status, content=response.model_dump())
    return response
