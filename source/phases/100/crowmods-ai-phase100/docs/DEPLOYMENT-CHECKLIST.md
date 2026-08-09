# CrowMods AI — Production Deployment Checklist

## Identity

- [ ] OIDC issuer verified
- [ ] Audience verified
- [ ] JWKS URI uses HTTPS
- [ ] JWKS host allowlist configured
- [ ] JWT algorithm allowlist configured
- [ ] Token signature verification enabled
- [ ] Issuer validation enabled
- [ ] Audience validation enabled
- [ ] Clock validation configured
- [ ] Role claims come only from validated tokens

## Authorization

- [ ] Deny-by-default enabled
- [ ] RBAC policies reviewed
- [ ] Role hierarchy reviewed
- [ ] Scoped permissions reviewed
- [ ] Policy administration protected
- [ ] Dual approval enabled for privileged changes
- [ ] Policy rollback tested
- [ ] Access-review campaign configured

## Monitoring

- [ ] SIEM endpoint configured
- [ ] SIEM transport authenticated
- [ ] Alert escalation destinations verified
- [ ] Privileged-session monitoring enabled
- [ ] Anomaly thresholds reviewed
- [ ] Policy conflict checks scheduled

## Evidence

- [ ] Production KMS/HSM configured
- [ ] Signing key access restricted
- [ ] Key rotation configured
- [ ] Evidence storage immutable
- [ ] Evidence verification tested
- [ ] Retention policy documented

## Infrastructure

- [ ] TLS certificates valid
- [ ] Network egress restricted
- [ ] Database TLS enabled
- [ ] Production secrets stored in secret manager
- [ ] Backups verified
- [ ] Recovery procedure tested
- [ ] Least-privilege service accounts configured

## Operations

- [ ] Incident-response contacts verified
- [ ] Security escalation SLA documented
- [ ] On-call ownership assigned
- [ ] Audit retention configured
- [ ] Emergency access procedure documented

## Release gate

- [ ] `npm test` passes
- [ ] `npm run release:validate` passes
- [ ] Final evidence manifest generated
- [ ] Release artifact hashes recorded
- [ ] Security review completed
- [ ] Deployment approval recorded
