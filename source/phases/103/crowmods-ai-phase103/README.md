# CrowMods AI — Phase 103: Live Dependency Probes, Signed Health Evidence & Controlled Remediation

Extends Phase 102 from configuration-based health checks into controlled live
probe adapters and evidence-backed remediation workflows.

Included:
- live HTTPS JWKS probe
- TLS certificate inspection adapter
- timeout-aware HTTP probing
- signed health evidence abstraction
- controlled remediation plans
- remediation approval gates
- probe evidence persistence
- health/remediation dashboard
- regression tests
- smoke test

Production note:
The bundled live probes are defensive availability checks. They do not bypass
authentication, scan arbitrary networks, or mutate external systems. Production
remediation should use narrowly scoped service accounts and explicit approvals.
