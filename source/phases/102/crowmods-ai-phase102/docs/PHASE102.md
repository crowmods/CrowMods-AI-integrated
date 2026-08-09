# Phase 102 — Automated Security Health Probes

## Probe categories

### OIDC / JWKS

Checks:
- metadata availability;
- issuer presence;
- JWKS URI presence;
- HTTPS enforcement.

A production network probe should additionally verify:
- DNS;
- TLS certificate chain;
- HTTP status;
- response schema;
- issuer consistency;
- key-set freshness.

### TLS certificates

Certificate health should report:
- validity;
- expiration;
- days remaining.

Production should obtain certificate metadata from a trusted local probe or
approved certificate-management API.

### Database

The application readiness endpoint should validate:
- connectivity;
- TLS;
- authentication;
- migration state;
- basic query health.

### SIEM

Health should cover:
- authenticated connectivity;
- delivery latency;
- queue depth;
- failed deliveries;
- retry backlog.

### KMS

Health should cover:
- configured key identifier;
- key availability;
- signing permission;
- key version;
- rotation state.

## Alerting

WARN produces a medium-priority health signal.

FAIL and BLOCKED produce high-priority health alerts.

Production should connect these alerts to the approved incident/monitoring
pipeline.

## Security boundary

The health probe layer detects problems; it does not silently disable security
controls or bypass authorization when dependencies fail.

For security-sensitive failures, fail-closed behavior should remain the default.

## Next

Possible next work:
- certificate/JWKS live network adapters;
- signed health evidence;
- automatic remediation workflows;
- health SLO/SLA tracking;
- external monitoring integration.
