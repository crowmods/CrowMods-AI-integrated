# Phase 50 Notes

## Milestone architecture

Customer:
account
-> subscription
-> entitlements
-> invoices
-> support
-> notification preferences

Admin:
identity
-> role
-> command center
-> module permissions
-> AI task queue
-> audit events

## Authentication

Before production:
- connect a reputable identity provider;
- require MFA for privileged administrators;
- use secure, HttpOnly session cookies or an equivalent secure mechanism;
- implement CSRF protection where applicable;
- enforce server-side authorization;
- never trust role/module flags from the browser;
- rotate/revoke sessions;
- log privileged actions.

## Least privilege

Suggested roles:
- OWNER: full access;
- ADMIN: operational administration;
- EDITOR: releases/media/campaigns/knowledge;
- SUPPORT: community/support/subscriptions;
- ANALYST: analytics/revenue/subscriptions.

Adjust according to the actual team.

## AI control plane

AI should be treated as an orchestrator, not an unrestricted administrator.

Recommended states:
QUEUED -> RUNNING -> WAITING_REVIEW -> COMPLETED

Sensitive operations should require approval:
- publishing;
- financial changes;
- account access changes;
- consequential moderation;
- deletion;
- credential/permission changes.

## Zero-cost development

The architecture can be developed locally with PostgreSQL and open-source
components. Production will eventually require hosting, domains, storage,
email, API access and possibly AI inference costs.

Do not claim that any internet-facing site is literally impossible to hack.
Use defense-in-depth, backups, monitoring, patching, least privilege and
incident response instead.

## Next

Build the secure identity/auth layer, permission middleware, customer portal
backend, AI orchestrator/worker, secrets management integration, centralized
audit/observability and production deployment architecture.
