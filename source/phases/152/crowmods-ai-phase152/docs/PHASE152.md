# Phase 152 — Distributed Sliding-Window Rate Limiting

## Purpose
Provide a shared rate-limit state that remains consistent when multiple API
instances process requests concurrently.

## Implementation
- PostgreSQL-backed shared buckets
- Row-level `FOR UPDATE` locking
- Transactional counter updates
- Configurable window and request limits
- Throttled and escalated states
- Automatic bucket reset after window expiry

## Security
The limiter key must be derived from an authenticated identity, trusted
service identity, or another controlled server-side attribute. Do not allow
clients to select arbitrary keys that could bypass intended policy.

## Acceptance
Concurrent requests against the same limiter key serialize correctly,
limits are enforced, expired windows reset safely, and failures fail closed
with an observable error state.
