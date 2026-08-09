# CrowShield Production Checklist

## Identity
- [ ] Use a managed identity provider.
- [ ] MFA/passkeys for every administrator.
- [ ] Role-based access control.
- [ ] Re-authentication for sensitive actions.
- [ ] Session expiration/revocation.

## Network
- [ ] HTTPS only.
- [ ] CDN/WAF in front of public services.
- [ ] Private database network.
- [ ] Separate worker network.
- [ ] Restrict egress from untrusted-file workers.

## Uploads
- [ ] Quarantine.
- [ ] Malware scanning.
- [ ] Archive/decompression limits.
- [ ] Private object storage.
- [ ] Signed/controlled downloads.
- [ ] No execution of uploaded APKs.

## Secrets
- [ ] Managed secret store.
- [ ] No credentials in Git.
- [ ] Separate credentials per integration.
- [ ] Rotation/revocation process.

## Data
- [ ] PostgreSQL.
- [ ] Encryption in transit and at rest.
- [ ] Automated backups.
- [ ] Restore testing.
- [ ] Retention/deletion policy.

## Monitoring
- [ ] Central audit logs.
- [ ] Alerting for admin authentication failures.
- [ ] Alerting for unusual upload/publish activity.
- [ ] Dependency vulnerability monitoring.
- [ ] Incident response plan.

## Application
- [ ] OWASP ASVS review.
- [ ] Input validation.
- [ ] Authorization on every sensitive endpoint.
- [ ] CSRF protection where applicable.
- [ ] Rate limits.
- [ ] Security headers.
- [ ] Regular penetration testing.
