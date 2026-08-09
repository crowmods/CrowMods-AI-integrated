# Phase 70 Runbook

## Worker failure recovery

Worker heartbeat
-> stale detection
-> rebalance plan
-> explicit apply
-> new partition owner
-> lease renewal

The plan is separated from application so operators can review changes before
they are applied when required by policy.

## Partition safety

A rebalance must not create two active owners for the same partition within a
consumer group.

Production should rely on broker-native assignment or a transactional lease
mechanism.

## DLQ executor

DLQ item
-> execution job
-> bounded attempts
-> approved broker replay
-> success/failure

Do not silently replay an event forever.

## Lag alerts

Lag
-> threshold
-> severity
-> alert

Tune thresholds to actual service behavior. Lag alone does not prove an
incident; correlate it with throughput, processing errors and service impact.

## Observability

Monitor:
- worker heartbeats;
- active assignments;
- partition lag;
- rebalance frequency;
- DLQ volume;
- replay success/failure;
- consumer throughput.

## Security

Recovery actions are operationally sensitive.

Require authorization for:
- applying rebalances;
- replaying DLQ events;
- changing thresholds;
- modifying worker assignments.

Never execute arbitrary commands from event payloads.

## Next

Possible next work:
- real broker rebalancer;
- DLQ replay executor using broker adapter;
- lag alert integration with Phase 65 incidents;
- autoscaling controller;
- recovery audit dashboard.
