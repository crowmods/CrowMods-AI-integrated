# CrowMods AI — Integrated Build

All 300 uploaded phase packages are preserved and integrated through a
central Express gateway.

## Run

```bash
npm install
npm run integration:check
npm start
```

API:
- `/health`
- `/ready`
- `/api/phases`
- `/api/integration/status`
- `/api/phases/<number>/...`

The original phase source is under `source/phases/`.
Phase backend runtimes are under `services/phases/`.
Database SQL is under `database/source/`.

**Database SQL is not automatically applied.** The uploaded phases contain
incompatible duplicate table definitions that require semantic reconciliation.
