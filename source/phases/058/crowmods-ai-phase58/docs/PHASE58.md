# Phase 58 Runbook

## Progressive traffic

Default stages:
- 5% canary
- 25% early
- 50% majority
- 100% full

At each stage:
1. observe metrics for a defined window;
2. evaluate error rate;
3. evaluate latency;
4. evaluate health;
5. promote or rollback.

Do not promote solely because a deployment is technically reachable.

## Artifact integrity

The exact image digest tested in staging/canary must be the same digest
promoted to production.

Do not rebuild between environments.

## SBOM

Generate an SBOM for every release and retain it with release metadata. Use
the organization's approved scanner and policy thresholds.

## Signing

Sign artifacts in a trusted CI environment and verify signatures before
deployment.

## Kubernetes hardening

The sample manifests demonstrate:
- non-privileged container behavior;
- read-only root filesystem;
- dropped Linux capabilities;
- readiness/liveness checks.

Further production hardening should include:
- non-root UID;
- resource requests/limits;
- network policies;
- Pod Security standards;
- service-account least privilege;
- secret-store CSI or equivalent;
- admission policy;
- image signature verification.

## Deployment adapters

The adapter layer is intentionally provider-neutral. Implement it against the
chosen production platform only after networking, IAM and rollback behavior
are defined.

## Next

Build the complete provider adapter, real traffic router integration, artifact
signing in CI, full staging integration suite and automated release evidence
package.
