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

Public endpoints (no auth):
- `GET /` and `GET /releases` — index of published public releases
  (a custom domain pointed at the API serves this as its homepage)
- `GET /releases/:slug` — release page (HTML)
- `GET /releases/:slug/download` — artifact download
- `GET /sitemap.xml`, `GET /robots.txt`, `GET /og-logo.png`, `GET /favicon.ico`

Admin user management (role/email/status):
- `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`
- The API blocks changing your own role/status and deactivating yourself;
  deactivated users lose sessions and cannot log in.

## Public site, custom domain & admin link

Public release pages are static HTML served by the API. Their behavior is
configured from the admin panel under **Settings → Public Site & Custom
Domain**, stored on the `website` integration:

| Setting | Effect |
| --- | --- |
| `publicDomain` | e.g. `https://mods.example.com`. Point a DNS CNAME at the API host, then release pages, download links, canonical URLs and Open Graph tags render absolute URLs on your domain. When unset, relative `/releases/:slug` URLs are used. |
| `adminPanelUrl` | e.g. `https://crowmods-ai-web.onrender.com/admin`. Adds an "Admin" link to the footer of every public release page. |

Both values must be valid `http(s)` URLs (the API rejects anything else);
clearing a field removes it. Repeated saves update the existing integration
instead of creating duplicates.

The admin panel is a PWA: it ships a web manifest (`/manifest.webmanifest`),
SVG + 512px icons, an `apple-touch-icon.png`, and iOS/Android home-screen
meta tags, so it can be installed ("Add to Home Screen" on iPhone/iPad,
Chrome install prompt on Android/desktop).

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

If `ADMIN_EMAIL`/`ADMIN_PASSWORD` are unset, the API bootstraps
`admin@crowmods.test` with a randomly generated password and prints
`ADMIN_BOOTSTRAP email=... password=...` to its logs. With the in-memory
repository this account (and its password) is recreated on every restart,
so set the env vars (or `DATABASE_URL`) for stable credentials.

To restore a known admin password against a running API (no Render log access
needed), use the included helper:

```bash
node scripts/reset-admin.js   # sets admin@crowmods.test / admin123
# CROWMODS_BASE_URL, CROWMODS_ADMIN_EMAIL, CROWMODS_ADMIN_PASSWORD override defaults
```

Smoke-test a running deployment (health, public site, auth, phase gateway):

```bash
bash scripts/verify-live.sh
# BASE_URL, ADMIN_EMAIL, ADMIN_PASS overrides; run reset-admin.js first if needed
```
