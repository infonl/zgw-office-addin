# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    openrouter_api_key: str = ""
    default_model: str = "mistralai/mistral-small-3.2-24b-instruct-2506"
    app_name: str = "llm-relay"
    app_url: str = "http://localhost:8080"
    debug: bool = False
    log_level: str = "INFO"
    llm_temperature: float = 0.1
    llm_timeout_seconds: int = 120
    llm_max_tokens: int = 16384
    max_content_length: int = 500_000  # ~500KB


@lru_cache
def get_settings() -> Settings:
    return Settings()
