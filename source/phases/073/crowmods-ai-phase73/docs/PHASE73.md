# Phase 73 Runbook

## Capacity telemetry

Collect:
- worker count;
- consumer lag;
- throughput;
- error rate;
- CPU utilization;
- memory utilization.

Telemetry should be timestamped and associated with a consumer group.

## Hysteresis

Use two thresholds:

Scale out:
lag >= scale-out threshold

Scale in:
lag <= scale-in threshold

The gap between thresholds prevents rapid oscillation around one boundary.

## Verification loop

Scaling action
-> wait for stabilization window
-> observe worker count
-> observe lag
-> observe error rate
-> PASS / FAIL / ROLLBACK_RECOMMENDED

Verification should use several samples in production rather than one point.

## Rollback

A failed verification can recommend rollback. The actual rollback must pass
through the approved autoscaling adapter and authorization policy.

## Safety

Do not trigger immediate scale-in after a short healthy sample. Use cooldown,
hysteresis and stabilization windows.

Do not use capacity metrics as a substitute for incident correlation.

## Next

Possible next work:
- stabilization windows;
- multi-sample verification;
- real cloud capacity adapters;
- cost telemetry;
- automated incident recovery updates;
- chaos testing.
