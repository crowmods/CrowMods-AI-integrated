# Phase 104 — Production Security Integration Boundaries

## KMS/HSM signing

The `SigningProvider` contract separates application logic from the production
key-management system.

Production implementation requirements:
- managed KMS/HSM;
- asymmetric signing where appropriate;
- key version tracking;
- least-privilege service identity;
- audit logging;
- key rotation;
- verification support.

No production private key belongs in application source or environment files.

## Certificate-chain validation

The validation contract checks:
- trusted chain;
- hostname match;
- validity window.

A production adapter should obtain the certificate directly from the approved
TLS connection rather than trusting caller-supplied metadata.

## Authenticated SIEM delivery

The delivery contract requires an access token and produces an authenticated
HTTP event representation.

Production implementation should use:
- OAuth2 client credentials or approved workload identity;
- TLS certificate validation;
- SIEM audience validation;
- destination allowlisting;
- bounded retries;
- delivery telemetry.

Do not log bearer tokens.

## Fail-closed principle

If KMS/HSM signing is unavailable, the application must not silently replace
the production provider with a development signer.

If SIEM delivery fails, security authorization must not be weakened to restore
availability.

## Next

Possible next work:
- real KMS/HSM adapter implementation for the selected cloud;
- workload-identity based SIEM delivery;
- live certificate-chain acquisition;
- integration SLOs and alerting;
- production disaster-recovery validation.
