# CrowMods AI Integration Status

This build integrates all 300 phase archives into one repository without
overwriting phase source.

## Runtime integration

The 298 phase backends that contain `server.js` are preserved under
`services/phases/NNN/backend/`. Their server entrypoints are adapted to export
their Express application when `CROWMODS_INTEGRATED=1`. The central API mounts
each phase under `/api/phases/<number>/...`, avoiding route collisions.

## Preserved source

All 300 archives are extracted under `source/phases/NNN/`, including frontend,
workers, documentation, tests, and database source.

## Database limitation

The phase SQL contains incompatible redefinitions of shared tables. The
database source is therefore preserved and inventoried rather than blindly
executed. This is intentional: automatic concatenation could lose columns or
change constraints.

## Production status

This is an integration build/harness, not a production certification. It
requires dependency installation, runtime tests, PostgreSQL schema
reconciliation, authentication composition, and external provider
configuration before production deployment.
