# Phase 81 Runbook

## Replication

Record replication lag between source and target regions.

Healthy replication is determined against a configured lag threshold.

## Region health

Region scoring combines:
- availability;
- error rate;
- replication lag.

The score is a decision-support signal, not a substitute for provider health
checks.

## Failover simulation

The included adapter only simulates traffic movement and validates the target.
It does not alter DNS, load balancers, service discovery, or production
traffic.

## Recovery candidate

A recovery candidate is selected from enabled, healthy regions, preferring
higher health score and lower replication lag.

## Failback

Failback requires:
- replication healthy;
- target region healthy;
- data integrity verified;
- traffic readiness verified.

The service creates a plan rather than automatically moving production
traffic.

## Analytics

Historical RTO/RPO values are aggregated by target region to support DR
planning and game-day reviews.

## Production implementation

Real traffic control should be isolated behind an explicitly authorized
adapter with:
- change approval;
- dry-run mode;
- audit logging;
- rollback;
- provider health checks.

## Next

Possible next work:
- real replication adapters;
- controlled traffic-management adapter;
- automated DR game days;
- chaos testing;
- security hardening;
- regional capacity optimization.
