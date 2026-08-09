# Phase 127 — Dependency Circuit Metrics, Persistent Canary Cooldowns, Enforced SQL Takeover, Coverage Confidence & Alert Acknowledgement

## Dependency-specific circuit metrics
Metrics are tracked per dependency, including request volume, failures,
timeouts, failure rate, and p95 latency. A dependency health decision can
then be separated from global application health.

## Persistent canary cooldowns
Cooldown state survives process restarts because the state is stored in
PostgreSQL. Failure streaks and recovery streaks prevent oscillating rollout
behavior.

## Enforced takeover verification
A queue takeover is accepted only when exactly one row is updated and the
committed fencing version is exactly the expected version plus one.

## Coverage confidence intervals
Wilson score intervals provide a bounded confidence estimate around empirical
coverage. They are useful for monitoring but do not replace calibration
methodology.

## Alert acknowledgement
Operators can acknowledge an alert with an actor and note. Acknowledgement is
persisted so dashboards and governance workflows can distinguish active alerts
from reviewed events.

## Security boundary
Metrics, confidence intervals, cooldowns, and acknowledgement state are
operational controls. They do not grant access or bypass resource fencing.

## Next
Possible next work:
- dependency-specific automatic breaker transitions;
- persistent canary cooldown timers and recovery scheduling;
- direct invocation of the verified takeover SQL function;
- sequential coverage monitoring and confidence-aware calibration;
- alert acknowledgement history and unacknowledgement workflow.
