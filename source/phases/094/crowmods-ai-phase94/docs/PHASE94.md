# Phase 94 Runbook

## Trusted identity

This phase deliberately does not accept client-provided roles as authoritative.

The policy engine expects:

```text
validated token
  -> trusted claims
  -> server-side role extraction
  -> identity context
  -> policy evaluation
```

The development identity adapter exists only for deterministic local testing
and must not be enabled in production.

## Policy model

Each policy defines:
- policy name;
- resource;
- action;
- required roles;
- effect;
- priority;
- enabled state.

## Evaluation

Evaluation is deny-by-default.

For matching policies:
1. lower priority number is evaluated first;
2. the first role-matching policy decides;
3. explicit DENY blocks access;
4. ALLOW grants access;
5. no matching role produces default deny.

## Audit

Every policy decision is recorded with:
- subject;
- resource;
- action;
- policy;
- result;
- reason;
- roles;
- request ID.

## Production requirements

- disable development identity mode;
- connect Phase 92/93 verified-token middleware;
- extract roles only from validated claims;
- protect policy-management endpoints with admin authorization;
- restrict policy mutation;
- require change auditing;
- add approval workflow for high-impact policies.

## Next

Possible next work:
- policy administration authorization;
- role hierarchy;
- scoped permissions;
- approval workflow;
- policy simulation;
- complete security regression testing.
