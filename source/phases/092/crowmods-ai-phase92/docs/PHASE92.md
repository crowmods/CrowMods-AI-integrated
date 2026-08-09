# Phase 92 Runbook

## Verification pipeline

The verifier performs:

1. JWT parsing.
2. Algorithm allowlist check.
3. `kid` lookup.
4. JWKS refresh when the key is unknown.
5. Issuer validation.
6. Audience validation.
7. Expiry/not-before validation.
8. RSA signature verification.

## Supported development algorithms

The signature adapter currently demonstrates:
- RS256;
- RS384;
- RS512.

Do not expand the algorithm allowlist casually.

## JWKS rollover

When a new JWKS document is registered, the service computes:
- added keys;
- removed keys;
- retained keys.

In production, rollover should be driven by the identity provider's JWKS
endpoint and cache headers rather than an application operator.

## Transport security

The included transport is memory-only for deterministic development tests.

A production remote-JWKS transport must enforce:
- HTTPS;
- certificate validation;
- connection/read timeouts;
- response-size limits;
- redirect restrictions;
- provider URI allowlists;
- DNS/SSRF protections;
- caching.

## OIDC → RBAC

Token verification establishes identity. Authorization remains a separate
decision based on server-side role mapping.

Never treat a client-provided role list as authoritative in production.

## Next

Possible next work:
- production OIDC library integration;
- hardened HTTP JWKS transport;
- JWKS cache-control handling;
- server-side role extraction from validated claims;
- full authorization middleware;
- security regression suite.
