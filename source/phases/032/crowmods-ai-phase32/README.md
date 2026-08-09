# CrowMods AI — Phase 32: User Accounts & Premium Access

Adds the account and authorization foundation.

Features:
- user accounts
- password hashing
- email-verification state
- roles
- premium-access state
- session records
- account dashboard API
- admin user-management API
- audit events

This phase intentionally leaves actual email delivery and production identity
providers behind adapters. Never store plaintext passwords or session tokens.
Use secure cookies, CSRF protection where applicable, rate limits, MFA, and
verified email flows in production.
