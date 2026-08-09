# Phase 15 Security Notes

Prototype authentication is now separated from business logic.

Production hardening still required:
- Prefer secure HttpOnly SameSite cookies over browser-accessible tokens.
- Add CSRF protection when cookie authentication is enabled.
- Add email verification.
- Add password-reset tokens with short expiry and one-time use.
- Add MFA/passkeys.
- Add session management and revocation UI.
- Add login anomaly detection.
- Add account lockout/backoff carefully to avoid user enumeration.
- Return generic authentication errors.
- Enforce RBAC on every sensitive API endpoint.
- Require re-authentication for publishing/security/billing changes.
- Rotate secrets.
- Add security monitoring and incident response.
