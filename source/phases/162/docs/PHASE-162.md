# Phase 162 — Public-Key Registry

## Objective
Maintain versioned public-key metadata for trusted evidence signers.

## Included
- Node.js crypto-backed control module
- API endpoint
- PostgreSQL audit schema
- Regression tests
- Smoke test
- Documentation

## Security boundary
Private signing keys must never be accepted through API request bodies.
Production asymmetric signing and verification must use trusted key material,
a managed key service/HSM, or another approved cryptographic boundary.

## Acceptance
Required security context is validated, invalid requests fail closed, and
cryptographic operations are auditable without storing private key material.
