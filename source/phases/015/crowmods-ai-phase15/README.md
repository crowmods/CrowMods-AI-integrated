# CrowMods AI — Phase 15: Authentication & Admin Security Foundation

Adds a production-oriented authentication foundation:
- secure password verification
- signed session-token helper
- login/logout endpoint structure
- RBAC middleware
- protected admin-route examples
- email-verification/reset-token data model
- security audit events
- login rate limiting

Before production, use a mature identity provider or complete a full security
review. Configure HTTPS, secure cookies, CSRF protection, MFA/passkeys,
email delivery, session revocation, and managed secrets.
