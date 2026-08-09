# Phase 107 — Multi-Window Burn Rates, Policy Automation & Failover Safety

## Multi-window burn rates

Phase 106 evaluated burn rate. Phase 107 evaluates it across:
- short window;
- medium window;
- long window.

This reduces the chance that a brief spike or a slow degradation is missed.

## Error-budget policy

The policy engine can decide:
- CONTINUE;
- WARN;
- FREEZE_CHANGE;
- ESCALATE.

These decisions are advisory governance controls. They should integrate with
change-management systems rather than silently modifying deployments.

## Provider failover safety

For security-critical dependencies, an unhealthy primary provider produces
FAIL_CLOSED even if a fallback exists.

This is intentional.

Examples:
- identity verification unavailable;
- KMS signature unavailable;
- trusted certificate validation unavailable.

The system must not substitute an unverified or weaker security mechanism.

Recovery requires explicit revalidation before restoring sensitive operations.

## Reliability reports

Reports capture:
- total checks;
- successful checks;
- failed checks;
- availability;
- burn alerts.

Production reporting can add:
- error-budget consumption;
- SLO compliance;
- MTTR;
- provider incidents;
- change correlation.

## Next

Possible next work:
- automated change-management integration;
- SLO error-budget forecasting;
- incident correlation;
- provider recovery orchestration;
- executive security reliability reports.
