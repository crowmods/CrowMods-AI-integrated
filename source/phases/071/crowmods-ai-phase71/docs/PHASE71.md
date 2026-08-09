# Phase 71 Runbook

## Recovery-to-incident

Consumer lag
-> lag threshold
-> incident request
-> correlation with existing incident
-> escalation policy
-> recovery action planning
-> verification
-> resolution.

Avoid creating a new incident for every telemetry sample. Use the incident
deduplication/correlation layer from previous phases.

## Autoscaling

The capacity layer produces:
- SCALE_OUT;
- SCALE_IN;
- HOLD.

Recommendations are bounded by:
- minimum workers;
- maximum workers;
- scale step;
- target lag.

Actual scaling should be performed by the approved infrastructure controller.

## Recovery verification

Before closing a capacity-related incident, verify:
- lag decreased;
- error rate is healthy;
- service throughput recovered;
- no new related alerts appeared.

Lag improvement alone does not prove full recovery.

## Safety

Do not allow an AI agent or alert payload to directly modify production
capacity without an approved controller and authorization boundary.

Use:
- policy validation;
- maximum capacity limits;
- audit records;
- cooldown periods;
- rollback capability.

## Next

Possible next work:
- real autoscaling adapter;
- cooldown/hysteresis;
- incident bridge implementation;
- recovery-aware alert suppression;
- capacity cost telemetry;
- end-to-end chaos testing.
