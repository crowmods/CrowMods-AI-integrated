# Phase 88 Runbook

## SLO burn rate

Burn rate compares observed error consumption with the allowed SLO error
budget.

A burn rate above 1 means the error budget is being consumed faster than the
target rate.

## Multi-window detection

The service evaluates fast and slow windows independently.

A critical condition requires both windows to exceed their configured
thresholds.

## Incident timeline

Timeline events record:
- event type;
- actor;
- description;
- metadata;
- timestamp.

This provides an auditable incident narrative.

## Operational RBAC

Roles contain explicit permissions.

Example permissions:
- `ops.view`;
- `incident.ack`;
- `incident.resolve`;
- `incident.escalate`;
- `notification.dlq.replay`;
- `slo.modify`;
- `ops.admin`.

Denied actions are also audited.

## Identity

This phase intentionally does not implement passwords, tokens, or identity
verification. In production, `operatorName` must come from a trusted,
authenticated identity context rather than a client-controlled field.

## Safety

RBAC controls operational actions but does not automatically grant access to
cloud infrastructure. Infrastructure permissions should remain separately
scoped.

## Next

Possible next work:
- trusted identity-provider integration;
- SLO burn-rate alert automation;
- incident timeline UI;
- permission management UI;
- immutable audit export;
- security hardening.
