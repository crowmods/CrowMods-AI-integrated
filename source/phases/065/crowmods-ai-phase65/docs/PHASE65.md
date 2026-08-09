# Phase 65 Runbook

## End-to-end event pipeline

Telemetry
-> SLO evaluation
-> severity
-> deduplication
-> incident
-> escalation job
-> escalation worker
-> notification
-> acknowledgment
-> resolution
-> postmortem
-> closure

Every pipeline run gets a correlation ID so operators can follow one alert
across services.

## Deduplication

An unresolved matching incident should absorb repeated alerts rather than
creating a new incident for every telemetry sample.

Keep dedupe windows and keys aligned with the alert semantics.

## Postmortem

A postmortem should record:
- summary;
- impact;
- root cause;
- resolution;
- corrective actions;
- owner.

Do not include secrets or unnecessary personal data.

## Closure

An incident is not considered fully closed merely because the alert stopped.
Confirm:
- service recovered;
- timeline recorded;
- remediation documented;
- required postmortem completed;
- follow-up actions assigned.

## Security

The event pipeline must treat alert payloads as untrusted input.

Do not:
- execute commands contained in alerts;
- interpret alert fields as shell/code;
- allow arbitrary webhook destinations;
- expose incident data to unauthorized users.

## Next

Possible next work:
- real event streaming;
- production metrics adapter;
- incident correlation across services;
- automated postmortem evidence collection;
- service dependency graph;
- capacity/cost monitoring.
