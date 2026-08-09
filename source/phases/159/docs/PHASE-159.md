# Phase 159 — Replay Quarantine Escalation

## Objective
Escalate repeated replay anomalies into a controlled quarantine state.

## Included
- Backend control module
- API endpoint
- Regression tests
- PostgreSQL audit schema
- Smoke test
- Documentation

## Acceptance
Valid controlled context is accepted and missing required security context
fails closed.

## Integration
Merge this phase with the preceding CrowMods AI phases. The sample server is
not a replacement for central authentication, authorization, observability,
or production database configuration.
