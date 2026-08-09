# Phase 103 — Live Probes, Signed Health Evidence & Controlled Remediation

## Live JWKS probe

The HTTPS probe:
- requires HTTPS;
- disables redirects;
- uses a timeout;
- records latency;
- records HTTP status;
- produces signed evidence.

Production should additionally enforce:
- trusted CA validation;
- hostname verification;
- approved destination allowlists;
- DNS controls;
- response-size limits;
- rate limits.

## Certificate inspection

Certificate status distinguishes:
- PASS;
- WARN;
- FAIL;
- BLOCKED.

A production implementation should use a trusted TLS inspection source rather
than accepting client-supplied certificate metadata.

## Signed health evidence

Each probe result can be:
1. canonicalized;
2. hashed;
3. signed;
4. persisted with key version metadata.

The bundled signer is a development simulation.

Production should use a managed KMS/HSM signing adapter.

## Controlled remediation

Only explicitly allowlisted remediation actions can become plans.

High and critical plans require an independent approver.

The execute endpoint intentionally stops at a controlled-adapter boundary.
Production infrastructure mutation must happen through narrowly scoped,
audited service integrations.

## Security principle

Detection and remediation are separate controls.

A failed health probe must never cause the application to:
- disable authentication;
- bypass authorization;
- accept unverified tokens;
- trust an unapproved endpoint.

## Next

Possible next work:
- production KMS signing adapter;
- live certificate-chain inspection;
- authenticated SIEM health delivery;
- remediation ticket connectors;
- security SLO tracking.
