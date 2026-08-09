# Phase 34 Notes

Production hardening checklist:

## Edge
- managed WAF/reverse proxy;
- TLS everywhere;
- strict security headers;
- request-size limits;
- DDoS protection;
- distributed rate limiting.

## Identity
- MFA/passkeys for admins;
- RBAC;
- secure session management;
- login throttling;
- password-reset protections.

## Secrets
- dedicated secrets manager;
- no credentials in Git;
- regular rotation;
- least-privilege service accounts.

## Application
- dependency scanning;
- SAST/DAST in CI;
- secure upload handling;
- private object storage;
- signed URLs;
- database least privilege;
- parameterized queries;
- audit logs.

## Recovery
- encrypted backups;
- tested restore procedures;
- defined RPO/RTO;
- immutable backup copies;
- incident-response runbook.

## Monitoring
- authentication anomalies;
- upload failures;
- publishing failures;
- unexpected admin actions;
- database/storage errors;
- service health;
- security-event alerting.

The emergency controls in this reference implementation are not sufficient by
themselves for production. Protect them with admin authentication, MFA,
step-up authorization, audit logging, and a break-glass procedure.
