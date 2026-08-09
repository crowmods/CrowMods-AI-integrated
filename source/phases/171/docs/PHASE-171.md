# Phase 171 — RBAC Engine

## Objective
Provide role-to-permission evaluation with explicit deny-by-default behavior.

## Controls
- Explicit security context validation
- Deny-by-default behavior
- Auditable decision schema
- API boundary suitable for central authentication middleware
- Regression tests and smoke checks

## Security boundary
This phase does not replace an enterprise identity provider. Production
deployments must authenticate the actor before policy evaluation and must
protect audit storage.

## Acceptance
Unauthorized or incomplete requests are denied, while explicitly permitted
requests are allowed and auditable.
