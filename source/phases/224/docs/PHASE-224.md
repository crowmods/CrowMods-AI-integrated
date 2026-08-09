# Phase 224 — Asset-to-CVE Mapping

## Objective
Map validated vulnerability identifiers to known assets.

## Included
- Backend control module
- API boundary
- PostgreSQL audit schema
- Regression tests
- Smoke test
- Integration documentation

## Security
Production deployments must put this boundary behind central authentication
and authorization. Do not store credentials, private keys, or secrets in
source code, request payloads, or audit records.

## Acceptance
Valid controlled context is accepted, required actor context is enforced,
and disabled or invalid operations fail safely.
