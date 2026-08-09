# Phase 125 — Serializable Retry, Staged Recovery, Transactional Takeover, Drift-Aware Calibration & Alert Routing

## Serializable retry engine
Serialization failures (`40001`) can be retried with a bounded exponential
backoff and jitter. The retry budget prevents indefinite retry loops.

## Staged canary recovery
Recovery advances through explicit traffic stages only after consecutive healthy
observations. Poor health returns the rollout to zero traffic.

## Transactional queue takeover
An expired job can be taken over only when its fencing version still matches.
The database update must atomically change worker identity, lease token, and
fencing version.

## Drift-aware calibration
Calibration windows respond to both coverage error and forecast drift. Severe
drift expands the window more aggressively to collect a larger calibration
sample.

## Alert routing
Acknowledged alerts are not routed. Active suppressions temporarily prevent
routing. Otherwise severity determines the destination:
- CRITICAL → SECURITY
- WARNING → OPS
- INFO → GOVERNANCE

## Security boundary
Retry, recovery, calibration, and alerting remain separate from authorization.
Fencing and queue ownership are enforced at the protected resource/database
boundary.

## Next
Possible next work:
- production retry telemetry and circuit breaking;
- staged canary rollback-to-recovery transitions;
- fully transactional queue takeover with `UPDATE ... WHERE` verification;
- drift/coverage joint calibration controller;
- alert routing audit trails and acknowledgement APIs.
