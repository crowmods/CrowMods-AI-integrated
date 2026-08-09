# CrowMods AI — Phase 90: OIDC Foundation, RBAC Administration & Signed Audit Export

Adds a production-oriented identity and audit administration foundation.

Included:
- OIDC discovery/JWKS integration contract
- server-side role mapping
- RBAC administration APIs
- signed audit export abstraction
- append-only storage abstraction
- security-event correlation
- end-to-end security tests
- administration dashboard
- smoke test

The OIDC and append-only providers included here are development adapters.
Production credentials, issuer configuration, signing keys, and storage must
be supplied by the deployment environment.
