# Phase 57 Runbook

## Release lifecycle

Code
-> CI
-> migration validation
-> integration tests
-> immutable artifact
-> staging
-> smoke tests
-> canary
-> metric gate
-> production
-> post-deploy verification

## Database migrations

Migration files are ordered and checksummed.

If an already-applied migration changes, the migration runner stops instead of
silently applying a different migration under the same version.

For production:
- run migrations through a controlled deployment job;
- take/verify a backup before risky schema changes;
- use backward-compatible migrations;
- monitor migration duration;
- never run unreviewed destructive SQL automatically.

## Artifact integrity

Use image digests, not mutable tags, for production promotion.

For stronger supply-chain security:
- private registry;
- SBOM;
- vulnerability scan;
- signed images/attestations;
- provenance;
- protected deployment environment.

## Canary

Example gate:
- error rate <= 2%;
- latency <= 1000 ms;
- health pass rate >= 99%.

Tune these to real service SLOs before production.

If a gate fails:
-> stop promotion
-> route traffic to known-good release
-> open incident
-> preserve logs/metrics
-> investigate

## Important

The sample deployment workflows contain provider-neutral contracts rather
than pretending to deploy to a specific cloud. Connect them to your chosen
platform after defining credentials, networking and rollback behavior.

## Next

Build provider-specific deployment adapters, artifact signing/SBOM generation,
real staging integration tests, progressive traffic shifting and a complete
release dashboard.
