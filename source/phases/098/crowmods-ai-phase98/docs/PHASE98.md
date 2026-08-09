# Phase 98 Runbook

## Alert triage

Alerts support:
- acknowledgement;
- false-positive closure;
- escalation;
- closure.

Triage notes are mandatory.

Production should enforce:
- analyst identity from the trusted identity provider;
- role-based triage permissions;
- separation of duties;
- escalation SLAs.

## Privileged sessions

A session records:
- subject;
- session type;
- source;
- resource scope;
- lifecycle status.

Session events can be scored for suspicious behavior.

The scoring model is a triage signal, not a replacement for a SIEM/UEBA
system.

## Signed evidence

Evidence is:
1. canonically serialized;
2. hashed with SHA-256;
3. signed by the configured signing provider;
4. stored with key version and algorithm metadata.

The bundled provider uses HMAC only as a development simulation.

Production must use:
- managed KMS/HSM;
- key rotation;
- restricted signing permissions;
- immutable evidence storage;
- independent verification.

## Security operations

The dashboard exposes:
- open alerts;
- active privileged sessions;
- signed evidence volume;
- recent triage events.

## Next

Possible next work:
- full SIEM integration;
- automated escalation;
- privileged session termination controls;
- signed evidence export bundles;
- final release hardening and end-to-end security validation.
