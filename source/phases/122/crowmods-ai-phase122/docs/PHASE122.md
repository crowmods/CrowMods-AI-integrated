# Phase 122 — Serializable Fencing, Adaptive Canary, Lease Heartbeats, Conformal Calibration & Isolated KMS

## Serializable fencing
Adds a commit decision that rejects concurrent version changes, invalid version
transitions, resource mismatches, and payload-integrity failures.

A real database deployment should perform the final compare-and-swap inside a
SERIALIZABLE transaction or equivalent atomic primitive.

## Adaptive canary sizing
Traffic increments are sized from health headroom instead of a fixed step.
Threshold violations immediately produce rollback.

## Lease heartbeats
Claimed delegation jobs can renew their lease before expiry. Expired leases
cannot be renewed and must be reclaimed through the queue's atomic claim path.

## Conformal-style calibration
Absolute residuals provide a nonconformity score and empirical interval
coverage. This is a practical calibration mechanism, not a guarantee.

## Drift monitoring
Baseline and recent error MAE are compared to classify STABLE, WATCH, or DRIFT.

## Isolated KMS integrations
AWS KMS, Azure Key Vault, and GCP KMS are represented by isolated integration
classes. Provider clients are injected at runtime; no credentials or private
keys are stored in the application.

## Next
Possible next work:
- database-level compare-and-swap transactions;
- canary rollback hysteresis and automatic stabilization;
- lease fencing on renewal;
- online conformal recalibration and drift alerts;
- provider-specific SDK packages in isolated deployment units.
