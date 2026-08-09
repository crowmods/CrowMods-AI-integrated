# Phase 151 — Quorum Revocation Propagation

## Purpose
Ensure that revoking an approval invalidates dependent quorum decisions and
forces those decisions to be recalculated.

## Controls
- Unique active-actor counting
- Approval expiry handling
- Explicit revocation events
- Dependent queue propagation
- Auditable actor/reason fields
- Fail-safe pending state when quorum is no longer satisfied

## Security
The API must be protected by the application's authentication and
authorization layer. Revocation actions should require the appropriate
privileged permission.

## Acceptance
A revoked approval cannot contribute to an approved quorum, propagation is
audited, and dependent quorum records become pending until recalculated.
