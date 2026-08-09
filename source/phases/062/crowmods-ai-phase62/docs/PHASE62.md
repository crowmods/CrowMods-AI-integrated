# Phase 62 Runbook

## Telemetry

Capture operational metrics such as:
- request count;
- error count;
- error rate;
- latency;
- availability;
- queue depth;
- worker success/failure;
- database latency;
- provider error rate.

Avoid putting credentials, tokens or unnecessary personal data into metric
labels.

## SLO

An SLO defines the reliability target. An error budget is the amount of
unreliability permitted by that target.

Example:
- allowed error rate: 2%;
- observed error rate: 8%;
- burn rate: 4x.

Burn rate is a prioritization signal, not a universal incident threshold.
Tune alerts using the service's real SLO and observation window.

## Alert lifecycle

Telemetry
-> SLO calculation
-> threshold/burn-rate evaluation
-> alert
-> incident
-> mitigation
-> resolution

## Alert severity

Use severity based on actual impact:
- LOW: informational;
- MEDIUM: degradation with limited impact;
- HIGH: material service degradation;
- CRITICAL: major outage or serious security/data risk.

## Production architecture

For high-volume production:
application/worker
-> metrics collector
-> metrics backend
-> dashboard/alerting

Security events should also flow through the approved SIEM pipeline.

PostgreSQL telemetry storage in this phase is mainly suitable for development,
staging and low-volume operational data.

## Retention

Use a retention policy appropriate to operational needs. High-cardinality
metrics should be handled by a purpose-built metrics platform rather than
unbounded relational tables.

## Next

Possible next work:
- real metrics collector integration;
- alert routing;
- SLO burn-rate windows;
- on-call notifications;
- service-level dashboards;
- cost and capacity telemetry.
