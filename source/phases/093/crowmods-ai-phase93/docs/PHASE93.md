# Phase 93 Runbook

## Hardened JWKS transport

The transport validates:
- HTTPS;
- optional host allowlist;
- redirect rejection;
- timeout;
- response size.

It also parses `Cache-Control: max-age`.

Production should add:
- strict egress controls;
- DNS rebinding/SSRF protections;
- provider URI pinning;
- certificate validation;
- retry budgets;
- observability.

## Server-side claims

Roles must come from validated token claims or a trusted server-side mapping.

Do not use arbitrary client-provided role headers as authoritative identity
data in production. The development route keeps a small header-based role
simulation only for deterministic local testing.

## Authorization middleware

Authentication and authorization are separate:

Authentication:
- validates token;
- establishes subject;
- establishes trusted claims.

Authorization:
- checks required roles;
- records the decision;
- returns 401 or 403 appropriately.

## Protected routes

The phase demonstrates:
- viewer/admin protected read;
- admin-only protected operation.

## Security regression

Tests cover:
- HTTPS enforcement;
- host allowlisting;
- cache-control parsing;
- bounded transport;
- role extraction;
- role authorization;
- unauthenticated rejection.

## Next

Possible next work:
- remove development role-header simulation;
- trusted role extraction directly from verified JWT claims;
- production OIDC middleware;
- JWKS cache persistence;
- authorization-policy management;
- full end-to-end security regression suite.
