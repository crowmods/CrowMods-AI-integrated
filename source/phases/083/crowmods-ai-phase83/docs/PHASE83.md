# Phase 83 Runbook

## Exercise scheduling

Exercises can be represented as:
- one-off;
- weekly;
- monthly;
- other scheduler-supported cadences.

The API stores schedule intent. An external scheduler can trigger execution.

## Chaos experiments

Chaos providers use a contract:
- inject;
- recover;
- rollback.

The included provider is simulation-only.

Do not point a simulation endpoint at production resources.

## Capacity scoring

Capacity score combines:
- availability;
- utilization;
- replication lag;
- recovery readiness.

The score supports comparison across regions.

## Resilience scorecard

Overall score combines:
- recovery performance;
- regional capacity;
- chaos-exercise results.

Grades provide a simple executive signal while retaining the underlying
metrics for analysis.

## Safety

Real fault injection requires:
- explicit scope;
- authorization;
- dry-run;
- blast-radius limits;
- abort/rollback;
- audit logging;
- maintenance window;
- monitoring.

## Next

Possible next work:
- scheduler integration;
- real chaos-provider adapter;
- regional capacity forecasting;
- resilience trend analytics;
- security hardening;
- production readiness controls.
