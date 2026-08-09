# Phase 131

## Database-enforced worker failover
Failover uses a PostgreSQL compare-and-swap function. Exactly one affected row
and an incremented fencing version are required.

## Lease renewal CAS
Renewal requires worker identity, lease token, fencing version, and an active
lease at the database boundary.

## Retry latency histograms
Retry latency samples can be bucketed to support operational latency analysis.

## Calibration hysteresis
Calibration changes require repeated evidence before expanding or shrinking,
reducing oscillation around a target.

## Immutable alert-review exports
Exports receive a SHA-256 hash over their canonical event payload and the
reviewer/export count is persisted for governance traceability.

## Next
Possible next work:
- failover/renewal transaction audit joins;
- percentile aggregation from persisted retry samples;
- multi-cycle calibration deadbands;
- signed export manifests and retention policies.
