# Phase 87 Runbook

## Alert lifecycle

Alerts can move through:
- OPEN;
- ACKNOWLEDGED;
- RESOLVED;
- REOPENED;
- ESCALATED.

Lifecycle events are recorded separately for auditability.

## Incident correlation

Alerts can be grouped by correlation key.

The incident records:
- highest severity;
- alert count;
- SLO breach;
- status.

Resolved incidents can reopen when a sufficiently severe matching alert
returns.

## Notification retry worker

The retry endpoint processes eligible failed/pending deliveries.

A production worker should be scheduled externally and use:
- concurrency limits;
- provider-specific backoff;
- idempotency;
- jitter;
- circuit breaking.

## DLQ replay

DLQ records can be explicitly replayed into the pending queue.

Replay is an operator-controlled action.

## Telemetry export

TelemetryExporter provides an abstraction for exporting operational metrics.

The included implementation is simulation-only.

## Safety

Notification and incident systems do not automatically authorize remediation.
Remediation remains a separately controlled workflow.

## Next

Possible next work:
- production telemetry adapters;
- provider-specific notification adapters;
- incident timeline UI;
- automated SLO burn-rate analysis;
- operational RBAC;
- security hardening.
