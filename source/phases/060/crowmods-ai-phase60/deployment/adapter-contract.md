# Production Deployment Adapter Contract

The deployment adapter is the only component allowed to translate a release
manifest into provider-specific deployment actions.

Required operations:

- `validate(release)`
- `deploy(release)`
- `setTraffic(release, percent)`
- `health(release)`
- `rollback(release)`

Rules:
- consume immutable image digests;
- verify artifact signature/provenance before deployment;
- use a dedicated workload identity/service account;
- never accept cloud credentials from the browser or AI model;
- record deployment IDs and provider responses;
- make rollback idempotent;
- emit audit events.

Implement this contract for the selected provider only after its networking,
IAM and rollback behavior have been reviewed.
