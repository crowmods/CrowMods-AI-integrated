# Phase 90 Runbook

## OIDC foundation

The service stores OIDC provider metadata:
- issuer;
- JWKS URI;
- provider name.

Role mappings translate external identity-provider roles into internal
application permissions.

The included implementation does not validate JWT signatures itself.

Production should use a mature OIDC library or trusted gateway that validates:
- signature;
- issuer;
- audience;
- expiration;
- nonce/state where applicable.

## Audit export

Audit events are serialized deterministically, hashed with SHA-256, and signed
with HMAC-SHA256 in this development implementation.

Production signing keys must be stored in a dedicated secret/KMS/HSM system.

## Append-only storage

The included storage adapter rejects overwrites.

Production should use append-only/WORM-capable storage with retention and
access controls.

## Security-event correlation

Multiple security events can be grouped into a correlation key.

Repeated denied actions or critical events are marked suspicious.

## Production checklist

- trusted OIDC integration;
- JWKS rotation;
- audience validation;
- secure secret management;
- key rotation;
- append-only audit storage;
- restricted audit readers;
- export integrity verification;
- RBAC administration;
- security monitoring.

## Next

Possible next work:
- full OIDC token validation;
- JWKS cache/rotation;
- production KMS signing;
- immutable object-storage adapter;
- security incident workflows;
- comprehensive end-to-end authorization tests.
