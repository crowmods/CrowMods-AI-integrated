# Phase 123 — Database CAS Fencing, Canary Hysteresis, Lease Fencing, Online Calibration & Drift Alerts

## Database-level CAS fencing
The compare-and-swap helper models the resource boundary needed to prevent
stale writers and concurrent version conflicts. Production deployments should
execute the check and update atomically in a SERIALIZABLE transaction or
equivalent database primitive.

## Canary rollback hysteresis
Rollback requires persistent health failure rather than a single noisy sample.
Recovery likewise requires consecutive healthy observations, reducing
oscillation between rollout and rollback states.

## Fencing-aware lease renewal
A worker may renew a lease only when its fencing version matches the current
resource version. This prevents stale workers from extending authority after
a newer worker has taken ownership.

## Online conformal recalibration
A rolling residual window updates the prediction interval radius as new
outcomes arrive. Empirical coverage is stored for monitoring.

## Automated drift alerts
Forecast error drift is converted into INFO, WARNING, or CRITICAL alerts.
Alerts should be routed through the organization's existing incident or
governance notification system.

## Security boundary
The phase remains fail-closed around fencing and lease ownership. Forecast
alerts inform operators but cannot grant runtime authorization.

## Next
Possible next work:
- actual SQL SERIALIZABLE compare-and-swap implementation;
- canary recovery cooldown and rollback suppression windows;
- lease takeover fencing and atomic queue reclamation;
- adaptive online calibration windows;
- alert deduplication, acknowledgement, and escalation workflows.
