# Phase 91 Runbook

## JWT claims

The validation foundation checks:
- issuer;
- audience;
- expiration;
- not-before;
- subject.

It also parses the JWT header so the `kid` and algorithm can be selected.

The development endpoint intentionally does not implement raw cryptographic
JWT verification. Production should use a vetted JWT/OIDC library.

## JWKS

The cache supports:
- TTL expiration;
- key lookup by `kid` and algorithm;
- rotation;
- invalidation through the cache abstraction.

Production should fetch JWKS from the trusted provider and handle:
- cache headers;
- network failures;
- key rollover;
- unknown `kid`;
- algorithm allowlists.

## KMS/HSM abstraction

SigningProvider separates application code from key custody.

The development implementation uses HMAC in memory.

Production should use a managed KMS/HSM and never expose private signing keys
to the application process.

## Key rotation

Rotation changes the active signing-key version.

Production rotation should support:
- overlapping verification keys;
- staged rollout;
- old-key retirement;
- audit trails;
- emergency revocation.

## Security

Do not accept arbitrary client-supplied issuer, audience, JWKS, or signing
configuration in production. These values must come from trusted deployment
configuration.

## Next

Possible next work:
- vetted JWT library integration;
- remote JWKS retrieval;
- key rollover automation;
- managed KMS adapter;
- cryptographic audit rotation;
- end-to-end identity-to-RBAC authorization tests.
