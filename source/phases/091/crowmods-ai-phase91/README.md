# CrowMods AI — Phase 91: JWT Validation, JWKS Rotation & KMS Signing

Adds a hardened identity-validation and cryptographic-key abstraction layer.

Included:
- JWT validation contract
- issuer/audience/expiry checks
- JWKS cache and rotation model
- key-selection abstraction
- KMS/HSM signing contract
- development HMAC signer
- audit signature verification
- authorization integration tests
- security smoke test

The included cryptographic providers are development adapters. Production
deployments should use a vetted JWT/OIDC library and managed KMS/HSM keys.
