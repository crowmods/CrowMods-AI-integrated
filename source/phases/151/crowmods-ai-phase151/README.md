# CrowMods AI — Phase 151
## Quorum Revocation Propagation

Phase 151 implements propagation of approval revocations across dependent
quorum decisions. Revoked approvals are treated as inactive immediately,
dependent quorum state is recalculated, and propagation events are audited.

No credentials or secrets are included.
