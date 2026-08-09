# CrowMods AI — Phase 93: Hardened JWKS Transport, Server-Side Claims & Authorization Middleware

Adds a reusable security boundary around OIDC verification and RBAC.

Included:
- hardened HTTP JWKS transport contract
- HTTPS/provider allowlist checks
- timeout and response-size limits
- redirect policy
- cache-control parsing
- server-side role extraction from validated claims
- authorization middleware
- protected route examples
- security regression tests
- smoke test

The network transport is implemented as a deterministic development adapter.
Production deployments should use a vetted HTTP client with strict TLS and
network egress controls.
