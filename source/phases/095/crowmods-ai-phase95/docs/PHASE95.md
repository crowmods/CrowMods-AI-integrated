# Phase 95 Runbook

## Role hierarchy

Roles can inherit from one parent role.

Example:

```text
ops.admin
  -> ops.viewer
  -> ops.read
```

Effective roles are expanded server-side.

## Scoped permissions

Scopes bind:
- role;
- resource;
- action.

This provides a foundation for fine-grained authorization beyond broad roles.

## Policy simulation

Simulation evaluates a proposed authorization context without mutating
authorization state.

It is useful for:
- access reviews;
- policy changes;
- troubleshooting;
- pre-deployment checks.

## Protected RBAC administration

RBAC administrators are required for direct role/scope administration.

High-impact policy changes can instead be submitted as change requests.

## Approval model

The approval foundation enforces:
- authenticated identity;
- dedicated approver role;
- separation of requester and approver;
- change audit.

The current phase does not automatically apply approved policy changes.

## Production checklist

- connect Phase 92/93 verified identity middleware;
- disable development identity mode;
- protect all administration routes;
- require MFA through the identity provider;
- add dual approval for critical changes;
- add policy versioning;
- add rollback;
- alert on authorization anomalies.

## Next

Possible next work:
- policy versioning and rollback;
- dual approval;
- access review workflows;
- authorization anomaly detection;
- privileged-action monitoring;
- final security hardening phases.
