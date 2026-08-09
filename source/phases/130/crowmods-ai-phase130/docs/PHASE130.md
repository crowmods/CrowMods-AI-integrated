# Phase 130 — Worker Lease Failover, Renewal Fencing, Retry Telemetry, Sequential Calibration & Alert Review Access

## Persistent worker failover
Expired worker leases can transition to a candidate worker while advancing the
fencing version. The database remains the authoritative enforcement boundary.

## Scheduler renewal fencing
Lease renewal requires matching worker identity, lease token, and fencing
version. Expired leases cannot be renewed through the normal path.

## Takeover retry backoff telemetry
Retry decisions expose bounded backoff delays so serialization-conflict
behavior can be measured without allowing indefinite retries.

## Sequential confidence calibration
Calibration accumulates coverage observations and uses confidence bounds to
expand, shrink, or hold the sampling window.

## Paginated alert review access
Alert review supports bounded pagination and role-aware permissions:
- viewer: VIEW
- operator: VIEW, ACKNOWLEDGE
- security_admin: VIEW, ACKNOWLEDGE, EXPORT

The endpoint records denied review attempts for governance monitoring.

## Security boundary
Role checks are an application-layer control and should be paired with the
deployment's authenticated identity and database authorization. Worker
fencing remains authoritative for resource ownership.

## Next
Possible next work:
- database-enforced worker failover transactions;
- lease renewal compare-and-swap SQL functions;
- retry latency histograms and conflict-rate alerts;
- confidence-aware calibration hysteresis;
- immutable alert review exports with stronger authorization boundaries.
