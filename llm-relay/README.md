# LLM Relay

FastAPI service that relays document analysis requests to OpenRouter. Send a document + prompt + desired output schema, get structured JSON back.

## How it works

1. You POST a document (base64-encoded or plain text), a prompt, and an output schema
2. The relay extracts text based on content type (`.docx`, `.xlsx`, `.eml`) or sends images via the vision API
3. It constructs a system prompt that instructs the LLM to return JSON matching your schema
4. The LLM response is parsed into JSON and checked against your schema keys (missing keys are logged as warnings but do not cause the request to fail)
5. You get back structured JSON that best-effort follows your schema; you should still perform any critical validation on the client side

## Supported content types

| Content type | Handling |
|---|---|
| `text/plain`, `text/html` | Decoded from base64, sent as text |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Text extracted from .docx via python-docx |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Cell data extracted from .xlsx via openpyxl |
| `message/rfc822` | Headers + body + attachment list extracted from .eml |
| `image/png`, `image/jpeg`, `image/webp`, `image/gif` | Sent via vision API as base64 data URL |
| (any other / none) | Attempt UTF-8 decode, fallback to cp1252; undecodable binary content is rejected with an error response |

## Endpoint

### `POST /api/v1/generate`

**Text document request:**

```json
{
  "content": "<base64-encoded document>",
  "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "attachment_type": "file",
  "prompt": "Summarize this document and extract key topics.",
  "output_schema": {
    "summary": "str",
    "topics": "list[str]",
    "language": "str"
  }
}
```

**Image request:**

```json
{
  "content": "<base64-encoded image>",
  "content_type": "image/png",
  "prompt": "Describe what you see in this image.",
  "output_schema": {
    "description": "str",
    "objects": "list[str]"
  }
}
```

**Fields:**

- `content` (required) — base64-encoded document content. Plain text is accepted as fallback.
- `prompt` (required) — the instruction for the LLM.
- `content_type` (optional) — MIME type. Determines how content is extracted/sent. If omitted, defaults to UTF-8 text decode.
- `attachment_type` (optional) — `"file"` or `"item"` (email). Adds context to the LLM prompt.
- `output_schema` (optional) — JSON dict describing the desired return shape. Defaults to `{"beschrijving": "str"}`.
- `model` (optional) — OpenRouter model ID. Defaults to `mistralai/mistral-small-3.2-24b-instruct-2506`.

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": "The document discusses...",
    "topics": ["climate", "policy"],
    "language": "en"
  },
  "model_used": "mistralai/mistral-small-3.2-24b-instruct-2506",
  "error": null
}
```

### `GET /health`

Returns `{"status": "ok", "service": "llm-relay"}`.

### Swagger / OpenAPI docs

- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

## Running

### With Docker (recommended)

```bash
# From the repo root
just relay-up          # start the container
just relay-rebuild     # rebuild and start
just relay-logs        # tail logs
```

### Without Docker

```bash
just relay-install     # install dependencies
just relay-dev         # start with hot reload on :8080
```

### Testing

```bash
just test              # run pytest
just relay-test-request                    # default sample request
just relay-test-request path/to/payload.json  # custom payload
```

## Configuration

All configuration is via environment variables. When running via docker-compose, set these in `.env` at the **repo root** (docker-compose maps them to the container). When running locally with `just relay-dev`, the app reads `.env` from the `llm-relay/` directory.

| Variable | Default | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | (empty) | OpenRouter API key. Required for requests to succeed. |
| `DEFAULT_MODEL` | `mistralai/mistral-small-3.2-24b-instruct-2506` | Fallback model (vision + JSON capable) |
| `LOG_LEVEL` | `INFO` | Log level |
| `DEBUG` | `false` | Debug mode |
| `LLM_TEMPERATURE` | `0.1` | Sampling temperature |
| `LLM_TIMEOUT_SECONDS` | `120` | Request timeout |
| `LLM_MAX_TOKENS` | `16384` | Max tokens in LLM response |
| `MAX_CONTENT_LENGTH` | `500000` | Max input content size in characters |

Note: docker-compose uses `LLM_RELAY_LOG_LEVEL` / `LLM_RELAY_DEBUG` as outer variable names and maps them to `LOG_LEVEL` / `DEBUG` inside the container to avoid collisions with other services.

## Development

```bash
just fmt               # ruff format + lint fix
just test              # run pytest
```
