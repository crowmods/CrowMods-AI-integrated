# Phase 134

## Authorized retention executor
Retention operations use an explicit allowlist of table handlers and role
permissions. Unknown tables and unauthorized actions are rejected.

## Rolling retry baselines
Retry samples are maintained as bounded rolling windows and reduced to p50,
p95, and p99 latency baselines.

## Calibration checkpoint CAS
Calibration state changes require an exact checkpoint version, preventing
stale controller instances from overwriting newer state.

## Persisted manifest integrity
Payload and manifest hashes are persisted with verification status so later
integrity checks can be audited.

## Security boundary
The retention executor is intentionally allowlist-based. Production handlers
should still enforce authenticated identity, database permissions, bounded
batch sizes, and transaction safety.

## Next
Possible next work:
- transactional purge handlers with row-level audit entries;
- rolling baseline anomaly alerts;
- calibration checkpoint lease ownership;
- automated manifest re-verification jobs.
