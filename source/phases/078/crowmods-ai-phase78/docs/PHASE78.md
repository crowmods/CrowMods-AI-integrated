# Phase 78 Runbook

## Cryptographic signatures

Evidence
-> canonical payload
-> Ed25519 signature
-> key ID/version
-> stored signature
-> verification.

The included key provider is for development.

Production should use a managed KMS/HSM and never store private keys in the
application database.

## Key rotation

Each key has:
- key ID;
- version;
- algorithm;
- status;
- creation time;
- retirement time.

Old signatures remain verifiable with their historical key version.

## Immutable export

The export adapter models append-only storage and retention metadata.

Production should map this interface to object storage with:
- Object Lock/WORM;
- retention enforcement;
- versioning;
- access logging;
- encryption;
- lifecycle policies.

## Certification

An incident can be certified only when there is:
- signed evidence;
- immutable export;
- audit-chain evidence.

This is an integrity certification, not a legal/compliance certification.

## Security

Do not use the memory key provider in production.

Use:
- KMS/HSM;
- least-privilege IAM;
- key rotation;
- secure secret handling;
- audit logging;
- immutable retention.

## Next

Possible next work:
- real KMS adapter;
- real WORM storage adapter;
- provider integration certification;
- disaster recovery testing;
- production security hardening.
