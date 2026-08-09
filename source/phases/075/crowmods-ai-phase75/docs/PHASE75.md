# Phase 75 Runbook

## Incident lifecycle integration

Recovery evidence
-> SLO checks
-> timeline completeness
-> postmortem evidence
-> closure gates
-> READY_FOR_CLOSURE.

The service should not silently close incidents.

## SLO recovery

An SLO check records:
- SLO name;
- target;
- observed value;
- direction;
- health result;
- timestamp.

Use the appropriate SLO semantics for each metric.

## Closure gates

All required gates must pass:
1. recovery verified;
2. SLO verified;
3. incident timeline complete;
4. postmortem evidence complete.

## State transitions

The phase provides:
- RECOVERY_VERIFIED;
- READY_FOR_CLOSURE.

Actual final closure should remain an explicit incident-management action.

## Auditability

Record:
- previous state;
- new state;
- reason;
- actor;
- timestamp.

## Security

Require authorization for incident state changes and closure operations.
Recovery evidence should be append-oriented and protected from unauthorized
modification.

## Next

Possible next work:
- full incident API adapter;
- SLO provider adapters;
- automated evidence collection;
- postmortem generation;
- closure approval workflow;
- end-to-end recovery tests.
