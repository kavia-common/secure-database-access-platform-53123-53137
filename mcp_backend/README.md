# mcp_backend (mcp-database-server)

This container demonstrates an MCP database server and a companion REST API that follow the `mcp-development-standards`:

- **Parameterized SQL only** (`$1..$n` placeholders + `parameters[]`)
- **Connection pooling** (`pg.Pool`)
- **Read-only vs read-write modes** (`ro` / `rw`)
- **API key authentication** (`x-api-key` for REST; `apiKey` field for MCP tool payloads)
- **Structured logging** (pino JSON logs)
- **Health endpoints** (service + DB ping)
- **Tests** (Jest + Supertest)

## REST API

Docs: `GET /docs`

### Auth
Send header: `x-api-key: <MCP_API_KEY>`

If `MCP_API_KEY` is not set, auth is permissive (intended for local dev only).

### Endpoints

- `GET /` service health
- `GET /health/db` database connectivity check (`SELECT 1`)
- `POST /db/query` parameterized query (default `mode=ro`)
- `POST /db/execute` parameterized execute (`mode=rw` required)

Example (query):

```bash
curl -sS -X POST http://localhost:3000/db/query \
  -H 'content-type: application/json' \
  -H 'x-api-key: test-key' \
  -d '{"sql":"SELECT $1::int as n","parameters":[1],"mode":"ro"}'
```

Example (execute):

```bash
curl -sS -X POST http://localhost:3000/db/execute \
  -H 'content-type: application/json' \
  -H 'x-api-key: test-key' \
  -d '{"sql":"UPDATE demo_table SET updated_at = NOW() WHERE id = $1","parameters":[123],"mode":"rw"}'
```

## MCP (stdio) server

Implementation: `src/mcp/mcpDatabaseServer.js`

This MCP server exposes two tools:

- `db_query`
- `db_execute`

Auth for MCP tool calls is done by including `apiKey` inside the tool input payload (in addition to the SQL fields).

## Environment variables

See `.env.example`.

At minimum you must set:

- `POSTGRES_URL` (or split `POSTGRES_URL_RO` / `POSTGRES_URL_RW`)
- `MCP_API_KEY` (recommended)

## Tests

```bash
npm test
```
