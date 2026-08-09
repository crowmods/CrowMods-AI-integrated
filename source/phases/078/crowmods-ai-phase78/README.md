# CrowMods AI — Phase 78: Cryptographic Signatures, Key Rotation & Immutable Export

Hardens evidence integrity with a provider-neutral cryptographic signing layer.

Included:
- signing-key provider contract
- development Ed25519 key provider
- signature generation/verification
- key version metadata
- rotation metadata
- immutable export adapter contract
- development append-only export adapter
- retention policy model
- audit certification endpoint
- tests and smoke test

The development key provider is intentionally local. Production deployments
should use an approved KMS/HSM or managed key service.
