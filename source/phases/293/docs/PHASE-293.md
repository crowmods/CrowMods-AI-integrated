# Phase 293 — Cross-Service Event Bus

## Objective
Define a validated event envelope for service-to-service events.

## Included
- Fail-closed control module
- API boundary
- PostgreSQL audit schema
- Regression tests
- Smoke test
- Integration documentation

## Security
Production use requires the central authentication and authorization layer.
Do not put secrets, credentials, private keys, or unrestricted execution
controls into request bodies or audit records.

## Acceptance
Required actor context is enforced, bounded values are normalized, and
disabled or invalid operations fail safely.
