# Phase 132

## Transaction audit joins
Worker failover and renewal outcomes can be correlated with worker keys,
versions, and operation event identifiers.

## Persisted retry percentiles
Retry latency samples are reduced into p50, p95, and p99 rollups for
operational monitoring.

## Calibration deadbands
Repeated evidence is required before a calibration window changes, reducing
oscillation between expansion and shrinkage.

## Signed export manifests
Exports have a SHA-256 payload hash plus a separate manifest hash containing
reviewer, event count, and algorithm metadata.

## Retention controls
Retention decisions provide a deterministic eligibility check before purge
workers remove old records.

## Next
Possible next work:
- retention execution with batch limits and audit records;
- percentile trend windows and anomaly detection;
- calibration deadband persistence across controller restarts;
- manifest verification and export integrity checks.
