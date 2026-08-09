# Phase 109 — Incident Timelines, Deployment Correlation, Signed Recovery Evidence & Post-Incident Review

## Incident timelines

Timeline events are normalized and sorted chronologically.

Useful event types:
- INCIDENT_OPENED;
- SLO_BREACH;
- BURN_ALERT;
- PROVIDER_FAILURE;
- CHANGE_STARTED;
- CHANGE_COMPLETED;
- RECOVERY_STARTED;
- RECOVERY_VERIFIED;
- INCIDENT_RESOLVED.

## Deployment correlation

Incident windows can be compared with deployment windows and commit SHAs.

Temporal overlap is a correlation signal, not proof of causation.

Production correlation should also include:
- deployment ID;
- service;
- environment;
- commit;
- feature flag;
- owner.

## Recovery evidence

Recovery evidence is:
1. canonicalized;
2. hashed;
3. signed;
4. stored with key metadata.

The bundled signer is development-only. Production should use the approved
KMS/HSM adapter.

## Post-incident review

Review lifecycle:
DRAFT → IN_REVIEW → APPROVED → CLOSED

Critical unresolved actions prevent closure.

Recommended review sections:
- impact;
- timeline;
- root cause;
- contributing factors;
- detection quality;
- containment;
- recovery;
- security-control behavior;
- corrective actions.

## Security boundary

Post-incident automation must not rewrite evidence or silently mark failed
security controls as successful.

## Next

Possible next work:
- automated incident timeline ingestion;
- signed timeline snapshots;
- corrective-action SLA monitoring;
- review approval workflows;
- recurring security postmortem reporting.
