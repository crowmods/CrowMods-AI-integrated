# Phase 128 — Automatic Breakers, Recovery Scheduling, Verified SQL Takeover, Sequential Coverage & Alert History

## Automatic dependency breakers
Dependency state transitions are calculated from failure rate, timeout rate,
and p95 latency. OPEN breakers move to HALF_OPEN after a reset interval.

## Persistent recovery scheduling
Canary rollback schedules a persisted cooldown and next-check timestamp.
Recovery stages can therefore continue across application restarts.

## Direct verified takeover
The API invokes the PostgreSQL takeover function directly. The result is
accepted only when exactly one row changed and the fencing version advanced
by exactly one.

## Sequential coverage monitoring
Coverage is updated incrementally and paired with a Wilson interval. The
monitor classifies coverage as on-target, under-covered, over-covered, or
insufficient.

## Alert acknowledgement history
Acknowledgement, unacknowledgement, and operator comments are recorded as
immutable history events rather than overwriting the full audit trail.

## Security boundary
Automatic breakers and recovery scheduling control reliability behavior only.
Authorization and queue ownership remain enforced by database fencing.

## Next
Possible next work:
- dependency-specific breaker cooldown persistence;
- recovery scheduler workers with bounded leases;
- takeover retry handling for serialization conflicts;
- sequential confidence-aware calibration actions;
- alert history query, filtering, and operator review dashboard.
