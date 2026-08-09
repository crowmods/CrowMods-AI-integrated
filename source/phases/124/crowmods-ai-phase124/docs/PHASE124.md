# Phase 124 — SQL SERIALIZABLE CAS, Canary Cooldowns, Queue Takeover Fencing, Adaptive Calibration & Alert Escalation

## SQL SERIALIZABLE CAS

The phase includes a PostgreSQL implementation using:
- SERIALIZABLE transaction isolation;
- row locking with `FOR UPDATE`;
- expected-version validation;
- atomic version increment;
- state-digest update;
- serialization-conflict handling.

Production callers should retry serialization failures with bounded backoff.

## Canary recovery cooldowns

After unhealthy observations, recovery is held behind a cooldown. Once the
cooldown has elapsed, consecutive successful observations are required before
the rollout becomes stable again.

## Atomic queue takeover fencing

Expired queue leases can be taken over only when:
- the lease is actually expired;
- the expected fencing version still matches;
- the database update atomically changes worker ownership and fencing state.

This prevents stale workers from retaining authority.

## Adaptive calibration windows

The calibration window expands when empirical coverage error is materially high
and shrinks when calibration is comfortably within the target tolerance.
Minimum and maximum bounds prevent uncontrolled growth or collapse.

## Alert deduplication and escalation

Alerts receive a deterministic SHA-256 fingerprint. Repeated occurrences can
be aggregated, while critical alerts or repeated warnings are escalated.

## Security boundary

Governance alerts and forecast calibration remain advisory. They never grant
authorization. Queue ownership and fencing remain enforced at the database
boundary.

## Next

Possible next work:
- bounded automatic serialization retries;
- canary rollback suppression and staged recovery;
- queue takeover transactions with explicit lease fencing tokens;
- calibration drift-aware window selection;
- alert acknowledgement, suppression, and escalation routing.
