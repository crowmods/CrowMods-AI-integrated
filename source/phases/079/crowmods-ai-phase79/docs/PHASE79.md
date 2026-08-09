# Phase 79 Runbook

## KMS adapter

Production implementation should map the KMS contract to an approved
managed key service.

Required capabilities:
- sign;
- verify;
- key versioning;
- rotation;
- health/capability reporting.

Private key material must not be stored in the application database.

## WORM adapter

Production implementation should map the adapter to immutable object storage
with:
- object lock;
- retention;
- versioning;
- encryption;
- access logging.

## Provider certification

Certification checks:
1. KMS available;
2. WORM storage available;
3. retention enforcement available;
4. provider health checks passing.

A development adapter can demonstrate the contract but is not a production
certification.

## Disaster recovery validation

A DR validation should verify:
- backup exists;
- restore succeeds;
- audit/evidence integrity remains valid;
- provider credentials/connectivity can be restored.

Run DR tests regularly and retain their results.

## Security

Use environment-specific credentials and least privilege.

Never include:
- KMS secrets;
- cloud access keys;
- private signing keys;
- provider tokens

in source control, logs, exports, or test fixtures.

## Next

Possible next work:
- real cloud KMS adapter;
- real WORM/Object Lock adapter;
- automated DR restore rehearsal;
- cross-region recovery;
- security hardening;
- provider integration end-to-end certification.
