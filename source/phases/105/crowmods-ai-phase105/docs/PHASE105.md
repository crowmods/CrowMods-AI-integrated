# Phase 105 — Workload Identity, Live Certificate Acquisition & Security SLOs

## Workload identity

The SIEM integration can use workload identity instead of long-lived static
credentials.

The validation boundary checks:
- subject;
- audience;
- issuer.

Production should validate the credential cryptographically through the
approved identity provider and use short-lived credentials.

## Live certificate acquisition

The application exposes a connector contract rather than trusting arbitrary
caller-supplied certificate metadata.

Production connector requirements:
- trusted CA bundle;
- hostname verification;
- bounded timeout;
- destination allowlist;
- no arbitrary network destinations;
- certificate-chain inspection;
- expiration metadata.

## KMS contract

`ProductionKmsContract` defines the required provider boundary:
- provider;
- key ID;
- algorithm;
- region;
- sign;
- verify.

Private keys must remain inside the approved KMS/HSM.

## Security SLOs

SLO measurements can track:
- successful security-event delivery;
- SIEM availability;
- KMS availability;
- certificate-health availability;
- identity-provider availability.

Example:
99.9% target means the measured success ratio must remain at or above 99.9%.

## SLO breach severity

The implementation maps larger target gaps to higher severity.

Production should additionally account for:
- error-budget burn;
- duration;
- business criticality;
- correlated incidents.

## Next

Possible next work:
- error-budget tracking;
- burn-rate alerts;
- provider-specific workload identity adapters;
- live certificate connector;
- production KMS adapter;
- automated security SLO reports.
