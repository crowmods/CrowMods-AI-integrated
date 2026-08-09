# Phase 150

## Approval expiry and revocation
Approvals can expire based on time and can be explicitly revoked with an
actor and reason.

## Sliding-window replay limits
Replay requests are evaluated against a bounded time window rather than a
single lifetime counter.

## Hysteresis rollout/rollback
Versioned policies can move from DRAFT to ACTIVE or from ACTIVE to
ROLLED_BACK, with actor and reason recorded.

## Baseline confidence intervals
Observed lease-conflict samples produce mean, variance, and a bounded
confidence interval.

## Signed external evidence attestations
The package exposes an attestation envelope and verification interface.
The included implementation is a deterministic digest envelope for testing;
it is **not a cryptographic private-key signature**.

Production deployments should replace it with a managed signing service,
HSM, or equivalent trusted signing mechanism.

## Security boundary
Private signing keys must never be accepted through API request bodies or
stored in application tables. External attestations should be verified
against trusted signer identity and key material.

## Next
Possible next work:
- approval quorum revocation propagation;
- distributed sliding-window rate limiting;
- policy rollout canaries and automatic rollback;
- confidence-aware baseline decisions;
- real asymmetric signatures and signer trust-chain verification.
