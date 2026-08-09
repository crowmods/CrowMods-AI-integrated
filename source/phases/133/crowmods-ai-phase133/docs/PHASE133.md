# Phase 133

## Retention execution
Retention planning produces bounded purge batches and records a purge-run
audit record. Dry-run mode allows verification without destructive execution.

## Batch purge auditing
Each purge run records examined, eligible, skipped, and result counts.

## Retry trend anomaly detection
Current p95 retry latency is compared with a baseline. Configurable warning
and critical ratios classify regressions.

## Persistent calibration recovery
Calibration state can be restored from a checkpoint after a restart. Older
requested checkpoint versions are rejected.

## Export manifest verification
Stored payload and manifest hashes can be recomputed and compared. Verification
events are persisted for integrity auditing.

## Security boundary
The retention planner intentionally produces a bounded plan rather than
silently deleting arbitrary records. Production purge workers should use
allowlisted tables, parameterized keys, and explicit authorization.

## Next
Possible next work:
- authorized retention executor with allowlisted table handlers;
- rolling retry anomaly baselines;
- calibration checkpoint compare-and-swap;
- manifest verification against persisted export records.
