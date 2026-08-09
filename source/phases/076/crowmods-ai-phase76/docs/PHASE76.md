# Phase 76 Runbook

## Provider adapters

The phase defines provider-neutral contracts for:
- incident systems;
- SLO systems.

The included memory providers are development adapters only.

## Evidence collection

Recovery evidence should capture:
- incident ID;
- evidence type;
- source;
- summary;
- structured payload;
- timestamp.

Examples:
- scaling action;
- SLO result;
- recovery verification;
- worker health;
- lag trend.

## Timeline enrichment

Collected evidence can create a timeline entry through the incident adapter.
Production adapters should preserve the source timestamp and actor.

## Postmortem package

Evidence
-> package
-> minimum evidence check
-> READY
-> approval.

The package is an evidence bundle, not a generated claim of root cause.

## Closure approval

Closure request
-> validate closure gates
-> validate evidence package
-> pending approval
-> explicit approver
-> APPROVED.

The phase does not automatically close the incident.

## Security

Provider credentials must be kept in a secure secret store. Never expose
provider tokens in API responses or event payloads.

Require separate permissions for:
- evidence collection;
- incident mutation;
- closure request;
- closure approval.

## Next

Possible next work:
- real incident-provider integration;
- real SLO provider integration;
- signed evidence;
- immutable audit export;
- postmortem generation;
- end-to-end incident closure workflow.
