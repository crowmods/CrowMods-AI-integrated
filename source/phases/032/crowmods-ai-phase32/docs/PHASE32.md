# Phase 32 Notes

Account flow:

register
-> email verification
-> login
-> secure session
-> account dashboard
-> subscription entitlement
-> premium content

Production security:
- use a mature identity provider or hardened auth implementation;
- password hashing with a modern adaptive hash;
- secure, HttpOnly, SameSite cookies preferred for browser sessions;
- CSRF protection where cookie auth is used;
- rate-limit login/register/reset endpoints;
- MFA/passkeys for admin accounts;
- short-lived sessions and revocation;
- email verification;
- password-reset tokens with expiration;
- RBAC;
- audit logs.

Do not put long-lived bearer tokens in browser localStorage in production if
HttpOnly cookie sessions are practical.

Premium access should be derived from verified payment/subscription state rather
than a client-controlled flag.
