# Phase 100 — Final Release Validation

## Purpose

Phase 100 is the release gate for the application-level security architecture.

It validates:
- identity and JWT controls;
- JWKS controls;
- authorization;
- RBAC;
- governance;
- access reviews;
- anomaly detection;
- alert operations;
- privileged sessions;
- SIEM normalization;
- evidence integrity;
- evidence export.

## Important distinction

Application validation is not the same as a production security certification.

Before deployment, the organization must independently validate:
- cloud/network controls;
- TLS certificates;
- DNS;
- identity-provider configuration;
- MFA;
- KMS/HSM keys;
- SIEM destination;
- secrets management;
- database backups;
- logging retention;
- access to production infrastructure;
- incident-response procedures.

## Release states

### PASS

All application controls and required production configuration checks pass.

### BLOCKED

No application control failed, but one or more production prerequisites are
missing.

### FAIL

One or more security validation checks failed.

A release must not proceed when the state is FAIL or BLOCKED.

## Final release command

```text
npm test
npm run release:validate
scripts/final-release-validation.sh
```

## Production environment

The following must be configured before production release:

- `NODE_ENV=production`
- `OIDC_ISSUER`
- `OIDC_AUDIENCE`
- `OIDC_JWKS_URI`
- `OIDC_JWKS_HOSTS`
- `DATABASE_URL`
- `EVIDENCE_KMS_KEY_ID`
- `SIEM_ENDPOINT`

## Final status

This package marks the application architecture as **100/100 complete** when
the application test suite passes and production prerequisites are validated.
