# LLM Relay

FastAPI service that relays document analysis requests to OpenRouter. Send a document + prompt + desired output schema, get structured JSON back.

## How it works

1. You POST a document (base64-encoded or plain text), a prompt, and an output schema
2. The relay constructs a system prompt that instructs the LLM to return JSON matching your schema
3. It sends the request to OpenRouter (or any OpenAI-compatible API)
4. The LLM response is parsed and validated against your schema keys
5. You get back structured JSON matching what you asked for

## Endpoint

### `POST /api/v1/generate`

**Request:**

```json
{
  "content": "<base64-encoded document or plain text>",
  "prompt": "Summarize this document and extract key topics.",
  "output_schema": {
    "summary": "str",
    "topics": "list[str]",
    "language": "str"
  },
  "model": "mistralai/mistral-small-3.2-24b-instruct-2506"
}
```

- `content` (required) — base64-encoded document content. Plain text is accepted as fallback.
- `prompt` (required) — the instruction for the LLM.
- `output_schema` (required) — JSON dict describing the desired return shape. The LLM is instructed to return exactly these keys.
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
# Default sample request
just relay-test-request

# Custom payload from a JSON file
just relay-test-request path/to/payload.json
```

## Configuration

All configuration is via environment variables (set in `.env` at the repo root or passed via docker-compose):

| Variable | Default | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | (empty) | OpenRouter API key. Required for requests to succeed. |
| `DEFAULT_MODEL` | `mistralai/mistral-small-3.2-24b-instruct-2506` | Fallback model when none specified in request |
| `LLM_RELAY_LOG_LEVEL` | `INFO` | Log level |
| `LLM_RELAY_DEBUG` | `false` | Debug mode |
| `LLM_TEMPERATURE` | `0.1` | Sampling temperature |
| `LLM_TIMEOUT_SECONDS` | `120` | Request timeout |
| `LLM_MAX_TOKENS` | `16384` | Max tokens in LLM response |

## Development

```bash
just relay-lint        # ruff check
just relay-format      # ruff format + fix
```
