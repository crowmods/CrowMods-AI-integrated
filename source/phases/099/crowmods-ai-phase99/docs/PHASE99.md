# Phase 99 Runbook

## SIEM pipeline

Security events are normalized with:
- event type;
- severity;
- subject;
- resource;
- action;
- source;
- correlation ID;
- payload.

The development adapter buffers events in memory.

Production should use:
- authenticated transport;
- TLS;
- schema validation;
- retry/backoff;
- bounded queues;
- delivery monitoring;
- SIEM-side retention.

## Escalation

Severity determines escalation level:
- LOW: no escalation;
- MEDIUM: level 1;
- HIGH: level 2;
- CRITICAL: level 3.

Production should connect levels to approved incident-response destinations.

## Privileged-session response

Authorized operators can request:
- SUSPEND;
- END.

Production must enforce:
- trusted operator identity;
- privileged role;
- reason;
- approval requirements where appropriate;
- session-response audit.

## Evidence export

Evidence bundles contain:
- bundle type;
- digest;
- signature;
- key version;
- algorithm;
- record count;
- creator.

The development signer uses HMAC-SHA256.

Production must replace it with a managed KMS/HSM-backed asymmetric signing
provider and immutable evidence storage.

## Final validation

Run:

```text
npm test
npm run security:validate
scripts/final-security-smoke.sh
```

The validation harness covers the controls introduced through Phase 99.

## Next

Phase 100 is the final release-validation phase:
- complete end-to-end security regression;
- production configuration validation;
- deployment checklist;
- security evidence manifest;
- final release status.
