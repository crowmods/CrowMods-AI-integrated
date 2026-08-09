# Phase 119 — Downstream Fencing, Automated Canary Rollback, Delegation Worker, Forecast Calibration & KMS Signing

## Downstream fencing propagation

Fencing metadata is propagated to downstream services.

Downstream consumers validate:
- resource identity;
- fencing version;
- token validity.

A stale version is rejected before the downstream operation.

## Automated canary rollback

Rollout decisions evaluate:
- required safety checks;
- error rate;
- latency regression.

A failed gate or threshold violation produces ROLLBACK.

## Delegation revocation worker

The worker examines delegation records and identifies expired delegations.
Production scheduling should run this worker periodically.

## Forecast calibration

Forecasts are compared with actual outcomes to calculate:
- mean absolute error;
- bias;
- calibrated confidence.

This supports measuring whether forecasting quality is improving.

## Production KMS signing boundary

Governance bundles are hashed locally and submitted to an approved KMS/HSM
adapter for signing.

The application must never receive or store private signing keys.

The included adapter intentionally requires a provider client and fails closed
when it is not configured.

## Security boundary

Rollback, revocation, and signing workflows are auditable but do not grant
permission to bypass technical controls.

## Next

Possible next work:
- cryptographically bound downstream fencing tokens;
- automated canary rollout orchestration;
- durable delegation worker scheduling;
- calibration confidence intervals;
- provider-specific KMS adapters and signature verification.
