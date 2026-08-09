# Phase 72 Runbook

## Controlled scaling

Recommendation
-> policy validation
-> cooldown check
-> cost/budget check
-> approval
-> autoscaling adapter
-> capacity verification
-> incident recovery update.

## Cooldown

Cooldown prevents rapid oscillation.

For production, add hysteresis and separate scale-out/scale-in thresholds when
the workload requires it.

## Approval

The sample controller requires explicit approval before applying a non-HOLD
action.

A production implementation can integrate an approved deployment/autoscaling
controller while preserving authorization and audit boundaries.

## Cost-aware capacity

The sample cost model estimates:
workers × unit cost.

Real implementations should use provider pricing and workload-specific
capacity costs.

Do not let cost controls override safety or availability requirements.

## Rollback

If capacity expansion causes an unhealthy state, the action can produce a
rollback request to the adapter.

Rollback itself should be policy-controlled and verified.

## Security

The autoscaling API is operationally sensitive.

Require authentication and authorization before:
- approving scaling;
- applying scaling;
- rolling back scaling;
- changing capacity policies.

The development adapter does not modify real cloud infrastructure.

## Next

Possible next work:
- cloud autoscaling adapters;
- real capacity telemetry;
- hysteresis controller;
- cost provider integration;
- scaling verification loop;
- chaos/recovery testing.
