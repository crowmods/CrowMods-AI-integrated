# Phase 56 Runbook

## Pipeline

Pull request
-> tests
-> dependency audit
-> Docker build
-> merge

Staging:
-> deploy
-> migrations
-> smoke tests
-> functional verification

Production:
-> protected environment approval
-> immutable image
-> controlled deployment
-> readiness verification
-> monitoring
-> rollback if verification fails

## GitHub Environment

Create a protected `production` environment and require reviewers for
production deployments.

Store deployment secrets in GitHub Actions Secrets or, preferably, delegate
secret retrieval to the deployment platform.

## Migration safety

Use backward-compatible migrations where possible:

1. Add new schema.
2. Deploy code that supports both old/new schema.
3. Backfill safely.
4. Switch reads/writes.
5. Remove old schema in a later release.

Avoid destructive schema changes in the same deployment as code that still
depends on the old schema.

## Testing layers

Unit:
- pure functions;
- validation;
- authorization logic.

Integration:
- database;
- queue;
- API contracts.

Staging:
- real infrastructure;
- authentication;
- provider integrations;
- smoke tests.

Production:
- health/readiness;
- critical user flows;
- error rate;
- latency;
- queue depth.

## Rollback

A failed deployment should return traffic to the last known-good application
version. Database rollback is separate and requires a tested migration plan.

## Supply-chain security

For stronger production hardening:
- pin important action versions;
- use lockfiles;
- generate SBOMs;
- scan images;
- sign artifacts;
- restrict workflow permissions;
- protect release branches.

## Next

Build full staging integration tests, artifact registry/signing, database
migration runner, deployment-provider adapter, canary releases and automated
rollback based on health/error thresholds.
