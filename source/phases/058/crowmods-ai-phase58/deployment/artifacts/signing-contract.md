# Artifact Signing Contract

Production release artifacts should be signed in CI using a dedicated signing
identity.

Recommended flow:

source
-> build
-> SBOM
-> vulnerability scan
-> image digest
-> signature/attestation
-> registry
-> deployment verification

Verification must confirm:
- expected repository;
- expected digest;
- trusted signer;
- release provenance;
- successful security scan policy.

Keep signing keys outside the repository. Prefer short-lived workload identity
or a managed signing service.
