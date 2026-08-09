# CrowMods AI — Phase 102: Automated Security Health Probes

Adds continuous health probes for critical security dependencies.

Included:
- OIDC/JWKS endpoint health checks
- TLS certificate metadata checks
- database security readiness checks
- SIEM delivery health checks
- KMS configuration availability checks
- probe result persistence
- health-alert generation
- security health dashboard
- deterministic unit tests
- smoke test

The network probes are designed as explicit adapters. Production deployments
should apply strict egress controls, trusted CA validation, timeouts, retries,
and approved monitoring infrastructure.
