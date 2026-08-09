# Phase 51 Notes

## Zero-trust request path

client
-> identity provider
-> authenticated session
-> API gateway
-> identity lookup
-> role lookup
-> permission lookup
-> step-up check when required
-> service
-> audit event

Every request should be treated as untrusted until authenticated and
authorized.

## Production identity

Use a reputable OIDC/OAuth provider rather than implementing password storage
from scratch.

Recommended:
- OIDC authorization code flow with PKCE;
- MFA/passkeys for privileged users;
- Secure, HttpOnly, SameSite cookies;
- short session lifetimes;
- refresh-token rotation where applicable;
- account/session revocation;
- recovery controls;
- login anomaly monitoring.

## RBAC

Never trust:
- role in request JSON;
- role in localStorage;
- hidden UI fields;
- client-side permission flags.

Authorization must be decided server-side.

## Step-up authentication

Require additional authentication for high-impact operations such as:
- managing users;
- changing connectors;
- financial operations;
- destructive administrative actions.

## Rate limiting

Production API gateway should enforce:
- per-IP limits for unauthenticated endpoints;
- per-account limits for authenticated endpoints;
- stricter limits on auth and recovery;
- provider-aware backoff;
- abuse monitoring.

Use a shared store such as Redis when horizontally scaling.

## Secrets

Use a dedicated secrets manager. Never commit:
- API keys;
- OAuth client secrets;
- refresh tokens;
- database passwords;
- signing keys.

## Next

Build the AI orchestrator/worker with approval gates, centralized secrets
management, observability/SIEM integration, backups and production deployment.
