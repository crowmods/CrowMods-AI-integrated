# Phase 86 Runbook

## Notification providers

Notification delivery is abstracted behind NotificationProvider.

The memory provider is a development simulation.

Production adapters should implement:
- authentication;
- timeout;
- retry;
- idempotency;
- rate limiting;
- provider error classification.

## Retry and DLQ

Failed deliveries use exponential backoff.

After the configured attempt limit, the record moves to DLQ status.

## Suppression

Suppression windows allow planned maintenance or known events to reduce
duplicate alert noise.

Suppressions must be explicitly scoped and time-bounded.

## Observability

Metrics are stored as time-stamped measurements with labels.

A production deployment should expose these through the existing telemetry
stack as well.

## Anomaly policies

Policies define metric thresholds and severity.

The policy engine can be expanded with:
- operators;
- duration requirements;
- hysteresis;
- baselines;
- confidence requirements.

## SLO-aware correlation

Multiple alerts can be grouped by correlation key and marked when one or more
alerts indicate an SLO breach.

## Safety

Notification routing does not grant production remediation permissions.
Alerting and remediation remain separate concerns.

## Next

Possible next work:
- real notification adapters;
- telemetry export;
- policy hysteresis;
- alert lifecycle automation;
- incident auto-correlation;
- security hardening.
