# CrowMods AI — Integrated Build

CrowMods AI is a publishing/approval platform: admin panel + API for managing
Android package uploads, validation/scans, releases, approvals, publishing to
websites/Telegram/Discord, jobs, audit logs, notifications, analytics,
customers/plans, RBAC, and system health. It also preserves all 300 uploaded
phase packages through a central Express gateway.

## Architecture

- `apps/api` — Express API (foundation modules + phase gateway)
- `apps/web` — Next.js admin panel (mobile-first)
- `services/phases` — phase backend runtimes
- `database/migrations` — foundation Postgres schema (`001_foundation.sql`,
  `002_seed.sql` plans, `003_rbac_seed.sql` roles/permissions)
- `source/phases` — original phase source

The foundation runs on either an in-memory repository (default) or Postgres
when `DATABASE_URL` is set. Postgres schema is applied automatically at boot
via `PostgresRepository.migrate()` (tracks `schema_migrations`).

## Run

```bash
npm install
npm start                 # API only (default port 4000)

# Admin panel (separate process)
npm run build:web
PORT=4200 npm --prefix apps/web start
```

API endpoints (phase gateway):
- `/health`, `/ready`, `/api/phases`, `/api/integration/status`
- `/api/phases/<number>/...`

Admin API lives under `/api/admin/*` (auth via Bearer token).
Public site serves PUBLISHED + PUBLIC releases at `/releases/:slug`.

## Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 4000) |
| `DATABASE_URL` | Postgres connection string. If set, the API uses Postgres and auto-applies migrations. If unset, uses an in-memory repository. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Initial super-admin provisioned at boot (password must be ≥ 8 chars) |
| `UPLOADS_DIR` | Directory for uploaded artifacts (default `apps/api/data/uploads`) |
| `CORS_ORIGIN` | Allowed browser origin for admin API (e.g. the web panel URL) |
| `NEXT_PUBLIC_API_URL` | Web panel → API base URL (default `https://crowmods-ai-integrated.onrender.com`) |
| `SESSION_TTL_MS` / `PASSWORD_RESET_TTL_MS` | Optional auth TTL overrides |

## Test

```bash
npm test                 # full suite (node:test)
npm run lint
npm run typecheck
npm run integration:check  # verifies all 300 phases load
npm run migration:check    # verifies migrations against a Postgres URL
```

The full suite runs against the in-memory repository by default. To run it
against Postgres:

```bash
export PG_TEST_URL=postgres://user:pass@host/db
node --test --test-concurrency=1 $(find services/phases tests -type f \( -name '*.test.js' -o -name '*.test.mjs' -o -name '*.test.cjs' \) -print)
```

`PG_TEST_URL` must point at an empty/throwaway database — tests truncate it.
The `--test-concurrency=1` flag is required so test files don't clobber the
shared database.

## Deploy (Render)

Two services from `render.yaml`:

- `crowmods-ai-integrated` — API (web service). Set `DATABASE_URL`,
  `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optionally `CORS_ORIGIN` and `UPLOADS_DIR`.
- `crowmods-ai-web` — admin panel (static site). Set `NEXT_PUBLIC_API_URL` to
  the API service URL at build time.

To confirm Postgres is in use after boot, check the admin panel's
**System Health** page: `database` should read HEALTHY (DEGRADED means the
in-memory repository is being used because `DATABASE_URL` is unset).
