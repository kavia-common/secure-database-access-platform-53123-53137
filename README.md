# secure-database-access-platform (MCP Database Server Demo)

This repo contains two containers:

- `database` (PostgreSQL): workspace `secure-database-access-platform-53123-53138/database`
- `mcp_backend` (Express + MCP stdio server + REST API): workspace `secure-database-access-platform-53123-53137/mcp_backend`

## Step 04.00 integration (local dev)

### 1) Start the database container

From the database container workspace:

```bash
cd secure-database-access-platform-53123-53138/database
./startup.sh
```

This will start PostgreSQL on **localhost:5000** and create:

- `db_connection.txt` (admin/app user connection string)
- `mcp_connection_guidance.txt` (recommended RO/RW URLs and demo schema/table names)

### 2) Configure the backend with consistent env vars

The backend supports either:

- `POSTGRES_URL` (single URL used for both RO + RW), or
- `POSTGRES_URL_RO` and `POSTGRES_URL_RW` (recommended; least-privilege split)

For the included database container, the canonical local values are:

- `POSTGRES_URL=postgresql://localhost:5000/myapp`
- (optional, recommended) `POSTGRES_URL_RO=postgresql://mcp_ro:mcp_ro_password_change_me@localhost:5000/myapp`
- (optional, recommended) `POSTGRES_URL_RW=postgresql://mcp_rw:mcp_rw_password_change_me@localhost:5000/myapp`

> Note: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `POSTGRES_PORT` are also provided by the database container for compatibility, but the backend connects using the URL variables above.

If you want to quickly source suggested URLs, after running `./startup.sh` you can inspect:

- `secure-database-access-platform-53123-53138/database/mcp_connection_guidance.txt`

### 3) Start the backend

```bash
cd secure-database-access-platform-53123-53137/mcp_backend
npm install
npm run dev
```

Backend REST docs:

- `GET /docs`

### 4) Verify end-to-end flows (health/query/execute)

API key:
- If `MCP_API_KEY` is set, include `x-api-key: <MCP_API_KEY>`
- If `MCP_API_KEY` is not set, auth is permissive (local dev only)

#### Health
```bash
curl -sS http://localhost:3001/ | jq .
curl -sS http://localhost:3001/health/db -H 'x-api-key: change-me' | jq .
```

#### Query (RO by default)
```bash
curl -sS -X POST http://localhost:3001/db/query \
  -H 'content-type: application/json' \
  -H 'x-api-key: change-me' \
  -d '{"sql":"SELECT 1 as ok"}' | jq .
```

#### Execute (RW only; requires mode=rw)
```bash
curl -sS -X POST http://localhost:3001/db/execute \
  -H 'content-type: application/json' \
  -H 'x-api-key: change-me' \
  -d '{"sql":"CREATE TABLE IF NOT EXISTS demo_write_test(id bigserial primary key, created_at timestamptz default now())","parameters":[],"mode":"rw"}' | jq .
```

## Notes on MCP development standards

The backend enforces the key standards:

- Parameterized SQL only (`$1..$n` + `parameters[]`)
- Connection pooling (`pg.Pool`)
- Read-only vs read-write modes (`ro` / `rw`)
- API key auth (`x-api-key` for REST; `apiKey` in MCP tool payloads)
- Structured logging (pino)
- Health endpoints and DB ping
- End-to-end flows are testable using the cURL examples above

For detailed backend docs, see:
- `secure-database-access-platform-53123-53137/mcp_backend/README.md`
`````

Explanation: Update backend env example to explicitly match the database container’s local defaults and encourage RO/RW split URLs (while staying compatible with single POSTGRES_URL).
````write file="secure-database-access-platform-53123-53137/mcp_backend/.env.example"
# Express server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# API key auth (recommended for all non-local usage)
MCP_API_KEY=change-me

# PostgreSQL connection strings (consistent with the included database container)
#
# Option A (simple): one URL used for both RO/RW.
POSTGRES_URL=postgresql://localhost:5000/myapp
#
# Option B (recommended): split RO/RW URLs (least privilege).
# These default users/passwords are created by the database container startup script.
# POSTGRES_URL_RO=postgresql://mcp_ro:mcp_ro_password_change_me@localhost:5000/myapp
# POSTGRES_URL_RW=postgresql://mcp_rw:mcp_rw_password_change_me@localhost:5000/myapp

# Pool tuning (optional)
PG_POOL_MAX=10
PG_POOL_IDLE_TIMEOUT_MS=30000
PG_POOL_CONN_TIMEOUT_MS=5000
