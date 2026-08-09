# Phase 60 — Production Launch Runbook

## Launch gate

Production should not begin until all are true:

- CI passed;
- tests passed;
- security checks passed;
- artifact signature/provenance verified;
- staging passed;
- backup/restore verified;
- canary passed;
- human production approval recorded.

## Launch sequence

1. Freeze the release candidate.
2. Confirm exact commit SHA.
3. Confirm image digests.
4. Verify SBOM and signature.
5. Confirm staging evidence.
6. Confirm backup/restore evidence.
7. Deploy 5% canary.
8. Observe defined SLO window.
9. Promote progressively.
10. Verify full production.
11. Begin heightened post-launch monitoring.

## Post-launch monitoring

Watch:
- HTTP error rate;
- p95/p99 latency;
- authentication failures;
- queue depth;
- worker failures;
- database health;
- provider API failures;
- support-ticket volume;
- critical security events.

Compare against the established pre-launch baseline rather than arbitrary
numbers whenever reliable historical data exists.

## Rollback

Trigger rollback when:
- health checks fail;
- error rate breaches the release SLO;
- latency breaches the release SLO;
- critical security issue appears;
- data integrity is uncertain.

Rollback:
1. stop promotion;
2. shift traffic to known-good release;
3. verify health;
4. preserve telemetry;
5. open/upgrade incident;
6. investigate;
7. only retry after a new release candidate passes verification.

## Incident response

Severity should reflect customer impact and security/data risk.

For a suspected security incident:
- preserve logs and relevant evidence;
- revoke compromised credentials;
- isolate affected components;
- rotate secrets;
- assess scope;
- follow the organization's legal/notification requirements;
- document timeline and remediation.

Do not expose sensitive incident details in public logs.

## Launch checklist

### Technical
- [ ] DNS
- [ ] TLS
- [ ] secrets
- [ ] database
- [ ] queue
- [ ] monitoring
- [ ] backups
- [ ] artifact verification
- [ ] deployment adapter
- [ ] rollback tested

### Security
- [ ] MFA
- [ ] RBAC
- [ ] least privilege
- [ ] private database/queue
- [ ] security headers
- [ ] dependency/image scanning
- [ ] audit logging
- [ ] secret rotation procedure

### Operations
- [ ] owner/on-call assigned
- [ ] incident process ready
- [ ] support process ready
- [ ] launch window defined
- [ ] communication plan ready
- [ ] post-launch review scheduled

## Important

This package is a launch framework, not a claim that the platform is already
deployed. Real production launch requires a configured hosting provider,
domain, identity provider, databases, secrets manager, monitoring, external
API credentials and verified operational ownership.
