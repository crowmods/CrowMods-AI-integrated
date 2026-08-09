# Phase 89 Runbook

## Trusted identity context

Requests use an identity abstraction with:
- subject;
- provider;
- roles;
- expiration.

The development implementation reads these from request headers only to make
local integration testing possible.

Production deployments must replace this with a trusted identity-provider
integration. Client-controlled identity headers must never be treated as
authenticated in production.

## Automated SLO alerts

Alert rules define:
- service;
- fast burn threshold;
- slow burn threshold;
- severity.

Evaluation creates an alert when either configured burn threshold is breached.
A simultaneous fast/slow breach becomes critical.

## Immutable-style audit

Audit events are chained with SHA-256 hashes.

Each event references the previous event hash.

The verification endpoint detects:
- changed event data;
- broken previous-hash links;
- invalid event hashes.

For true immutability in production, export the chain to an append-only or
WORM-capable storage system and protect signing keys separately.

## Request correlation

Every request receives an `x-request-id` when one is not supplied.

The ID is returned in the response and included in security audit metadata.

## Security

Recommended production controls:
- OIDC/SAML or equivalent trusted identity provider;
- short-lived credentials;
- server-side role mapping;
- MFA at the identity provider;
- least privilege;
- secret management;
- TLS;
- rate limiting;
- audit export;
- key rotation;
- security monitoring.

## Next

Possible next work:
- production OIDC integration;
- signed audit export;
- RBAC administration UI;
- security event correlation;
- secrets/configuration hardening;
- end-to-end operational security tests.
