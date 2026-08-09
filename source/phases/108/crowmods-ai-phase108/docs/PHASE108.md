# Phase 108 — Forecasting, Correlation & Recovery Orchestration

## Error-budget forecasting

The forecast estimates time to budget exhaustion using:
- remaining budget;
- consumption rate;
- forecast horizon.

Statuses:
- SAFE;
- AT_RISK;
- EXHAUSTION_FORECAST;
- BLOCKED.

Forecasts are advisory and should not automatically disable production
services.

## Incident correlation

Signals can be correlated across:
- burn-rate alerts;
- provider failures;
- deployment/change windows;
- incident severity.

Temporal overlap provides a deterministic correlation signal.

Correlation is evidence for investigation, not proof of causation.

## Change correlation

An incident and change receive a confidence score based on overlapping
time windows.

Production systems should also correlate:
- service;
- deployment ID;
- commit;
- owner;
- environment;
- affected component.

## Recovery orchestration

Recovery states:

DETECTED
→ VALIDATING
→ APPROVAL_REQUIRED
→ RECOVERING
→ VERIFYING
→ RESTORED

Failure at verification produces `FAILED`.

Sensitive operations are restored only after verification passes.

## Security boundary

The orchestrator must never:
- disable authentication;
- bypass authorization;
- substitute an untrusted cryptographic provider;
- accept unverified certificates;
- downgrade security controls merely to restore availability.

## Next

Possible next work:
- automated incident timelines;
- deployment/commit correlation;
- recovery evidence signing;
- approval workflow integration;
- post-incident review automation.
