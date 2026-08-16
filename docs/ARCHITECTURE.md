# CrowMods AI — Foundation Architecture

This document describes the non-AI foundation built on top of the existing
300-phase integration gateway. The foundation provides the product backbone
(identity, uploads, releases, publishing, audit, analytics, customers) that the
future AI features will plug into.

## System Layout

```
apps/
  api/src/
    server.js                 # Main Express gateway: mounts foundation + 300-phase routes
    foundation/               # Non-AI product foundation (this doc)
      config/env.js           # Centralised env config
      db/                     # Repository abstraction
        index.js              # getRepository()/setRepository() factory
        memory.js             # In-memory implementation (tests / no DATABASE_URL)
        postgres.js           # Postgres implementation + migrate()
      lib/
        crypto.js             # Argon2 hashing, token generation, sha256
        rbac.js               # Permission middleware + role helpers
      modules/
        auth/                 # Login/logout/sessions/password-reset/users
        audit/                # Append-only audit log with secret redaction
        notifications/        # In-dashboard notifications
        uploads/              # Quarantine storage, size/magic validation, delete
        scans/                # Scan record creation
        metadata/             # Pure binary AndroidManifest.xml + ZIP parsing
        validation/           # Orchestrates upload -> metadata + scan -> VALID
        releases/             # Release lifecycle (DRAFT -> APPROVED -> PUBLISHED)
        publishing/           # Multi-provider publish engine + job queue
        jobs/                 # Generic job queue (enqueue/process/complete/fail/retry)
        customers/            # Customers + subscriptions
        plans/                # Plan definitions and entitlements
        analytics/            # Dashboard + aggregate analytics
        health/               # Component health checks
        integrations/         # Telegram/Discord/website connections
      routes/admin.routes.js  # /api/admin/* HTTP surface + auth/permission middleware
      index.js                # Foundation Express app + /releases/:slug public pages
  web/app/admin/              # Mobile-first admin panel (Next.js App Router)
database/
  migrations/                 # SQL migrations (001 schema, 002 seed, 003 rbac)
tests/
  foundation/                 # Integration tests + fixtures/helpers
scripts/
  lint.js                     # Syntax lint for foundation + tests + scripts
  typecheck.js                # JSON + config validation
  migration-check.js          # Migration ordering/structural checks
  integration-check.js        # 300-phase catalog verification
```

## Repository Abstraction

All services depend on `db/index.js` which returns a repository:

- `DATABASE_URL` set  -> `PostgresRepository` (migrated on startup via
  `initFoundation()`).
- `DATABASE_URL` unset -> `MemoryRepository` (used by the test suite).

Services call `getRepository()` per operation, so swapping the backing store
requires no service changes. `setRepository()`/`resetRepository()` are used by
tests to isolate state.

Migrations live in `database/migrations/*.sql` and are applied by
`PostgresRepository.migrate()` which records applied versions in
`schema_migrations`. Migration checks run in CI via `npm run migration:check`.

## AuthN / AuthZ

- Sessions: opaque bearer token; only the SHA-256 hash is stored.
  Configurable TTL (`SESSION_TTL_MS`, default 24h).
- Password hashing: Argon2 via `lib/crypto.js`.
- Password reset: one-time tokens stored as hashes with expiry
  (`PASSWORD_RESET_TTL_MS`, default 1h). Confirming a reset revokes all of the
  user's sessions.
- Initial admin: on boot, `initFoundation()` provisions a `SUPER_ADMIN` from
  `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars if set (idempotent). Set these on
  the host (Render dashboard) to unlock the admin API.
- RBAC: roles -> permissions mapping (seeded in `003_rbac_seed.sql`).
  Route-level checks use `requirePermission("resource.action")`. `SUPER_ADMIN`
  bypasses checks.
- Login is rate limited (`20 / 15 min`) keyed by client IP.
- Audit events are written for auth, uploads, releases, publishing, and admin
  actions. `audit.log()` redacts secret-like metadata keys (`[REDACTED]`).

## Uploads & Validation

- Allowed extensions: `.apk`, `.aab`, `.zip`.
- Files are stored under a local quarantine directory
  (`UPLOADS_DIR` or `apps/api/data/uploads`) with a random internal name and
  `0600` permissions.
- Validation checks ZIP magic bytes; size capped by `MAX_UPLOAD_BYTES`.
- `validate` runs pure binary parsing (never executes the file):
  ZIP central directory + binary AndroidManifest.xml string/attribute parsing
  to extract package, version, minSdk, permissions, etc.
- Scans are recorded as `scanner/version/timestamp/status/findings`; a clean
  scan does NOT claim malware-freedom.
- Uploads can be deleted (cancelled) before being referenced by a release;
  deletion removes the file and the DB record.

## Releases & Publishing

Release lifecycle: `DRAFT -> READY_FOR_REVIEW -> APPROVED -> PUBLISHED`
(with `REJECTED`/`CHANGES_REQUESTED` states). Approval requires the
`release.approve` permission (not available to OPERATOR).

Publishing:
- `POST /releases/:id/publish { providers: [...] }` creates one job per
  provider via an idempotency key (`pub:{provider}:{releaseId}`), so repeated
  calls return the existing job.
- Providers:
  - **website**: renders a release page and records
    `/releases/:slug`; published PUBLIC releases are served at that URL.
  - **telegram / discord**: perform a real API call when an integration with
    config is present; otherwise simulated with `simulated: true`.
- Jobs are processed by the generic job queue with retries and max attempts.

## Public Surface

The gateway exposes:

- `GET /health` — foundation + gateway liveness
- `GET /ready`
- `GET /api/phases` and `GET /api/phases/:n/...` — 300-phase catalog + runtime
- `GET /api/integration/status`
- `GET /api/admin/*` — authenticated admin API (mobile-first panel uses this)
- `GET /releases/:slug` — public, published, non-private release pages

## Admin Panel

`apps/web/app/admin/` is a mobile-first Next.js App Router UI with bottom-nav
on small screens and a sidebar on desktop. Pages: login, dashboard, uploads,
releases, approvals, publishing, customers, analytics, audit, health, settings.
It talks to the API via `NEXT_PUBLIC_API_URL` (defaults to
`https://crowmods-ai-integrated.onrender.com`).

## Deployment

- `render.yaml` defines two services:
  - **crowmods-ai-integrated** (API): runs lint, typecheck, migration check,
    integration check, web build, then `npm start` (`node apps/api/src/server.js`).
    Set `DATABASE_URL`, `CORS_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in the
    Render dashboard. On boot, `initFoundation()` runs pending SQL migrations
    and provisions the initial admin.
  - **crowmods-ai-web** (admin panel): builds `apps/web` (`npm ci && npm run
    build`) and serves it with `next start` on the Render-provided `PORT`.
    `NEXT_PUBLIC_API_URL` points at the API service (at
    `https://crowmods-ai-web.onrender.com`).
- CI: `.github/workflows/ci.yml` runs install, lint, typecheck, migration
  check, tests, integration check, and the web build on push/PR.
- `apps/web/package.json` start script binds `next start` to `PORT` (default
  3000) so it works on Render and locally.
- On production boot, `initFoundation()` runs pending SQL migrations before the
  server listens. Set `DATABASE_URL`, `CORS_ORIGIN`, and optionally
  `UPLOADS_DIR` for persistent quarantine storage.

## Operational Notes

- The 300 uploaded phase packages and their endpoints are preserved untouched;
  the foundation is additive.
- `docs/phase-catalog.json` drives the gateway; run
  `npm run integration:check` to verify the catalog is accounted for.
- All foundation tests run with an in-memory repository, so `npm test`
  needs no database. `npm run migration:check` validates the SQL migrations.