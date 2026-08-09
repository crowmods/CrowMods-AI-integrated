# Phase 59 Runbook

## Evidence model

A production release should have evidence for:

- CI passed;
- unit tests passed;
- integration tests passed;
- security checks passed;
- artifact digest/signature verified;
- staging smoke tests passed;
- database backup/restore verified;
- canary passed.

The readiness gate blocks production if any required evidence is missing.

## Authentication tests

Staging should verify:
- unauthenticated requests are rejected where appropriate;
- authenticated users receive only permitted resources;
- role boundaries work server-side;
- privileged actions require step-up authentication;
- revoked sessions stop working.

Do not test against real customer accounts.

## AI worker tests

Verify:
- unregistered tools are rejected;
- permission mismatch is rejected;
- approval-required actions cannot execute without approval;
- retry limits are bounded;
- failed verification does not promote a workflow;
- sensitive values are not written to logs.

## Database tests

Verify:
- migrations apply cleanly;
- migrations are repeatable/idempotent where intended;
- checksums detect modified applied migrations;
- backups can be restored in a disposable environment.

## Release evidence package

Recommended contents:
- commit SHA;
- artifact digests;
- SBOM reference;
- vulnerability scan result;
- test reports;
- staging URL/environment;
- migration result;
- backup verification;
- canary metrics;
- approval identity/time;
- deployment result;
- rollback evidence if applicable.

## Production readiness

The automated gate should produce a recommendation, not silently override
human approval for high-impact production changes.

## Next

The next milestone can be the full production launch package: provider-specific
deployment adapter, real artifact signing, staging environment integration,
final release dashboard, launch checklist and post-launch monitoring.
