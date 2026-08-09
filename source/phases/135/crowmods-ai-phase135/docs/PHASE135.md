# Phase 135

## Transactional purge handlers
Purge execution uses an allowlisted handler and wraps row audit insertion and
run accounting in a single database transaction.

## Row-level audit trail
Each purged record receives an explicit audit event containing run, table,
record key, action, and actor.

## Rolling baseline anomaly alerts
Current p95 latency is compared with a persisted baseline and classified into
NORMAL, WARNING, or CRITICAL.

## Calibration checkpoint leases
Calibration state can be protected by owner identity, lease token, fencing
version, and expiry.

## Automated manifest re-verification
Previously generated export hashes can be recomputed and compared on demand,
with every re-verification persisted.

## Security boundary
The purge endpoint only permits explicitly allowlisted tables. Production
deployments should still bind role identity to authenticated principals and
apply database-level authorization.

## Next
Possible next work:
- row-level purge eligibility enforcement inside SQL;
- persistent anomaly alert deduplication and cooldowns;
- calibration lease acquisition/renewal CAS endpoint;
- scheduled manifest re-verification batches.
