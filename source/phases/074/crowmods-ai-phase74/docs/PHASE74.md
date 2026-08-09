# Phase 74 Runbook

## Stabilization window

After a capacity change, do not immediately declare success.

Start a stabilization window and collect multiple samples.

## Verification sample

A sample evaluates:
- expected worker capacity;
- observed worker capacity;
- lag trend;
- error rate;
- throughput.

## Confidence

Confidence combines the healthy/unhealthy sample ratio with a maturity factor.
A high score requires enough observations, not just one good sample.

## Recovery states

VERIFYING
-> RECOVERED
or
-> ROLLBACK_RECOMMENDED

Only RECOVERED with closure eligibility should be considered for incident
resolution.

## Conservative closure

Closure should still be subject to the incident system's requirements:
- no active critical symptoms;
- timeline complete;
- required postmortem complete;
- follow-up actions assigned.

## Safety

The recovery controller only evaluates evidence and produces state. Production
rollback or remediation must use the approved autoscaling/infrastructure
controller.

## Next

Possible next work:
- recovery state → incident API integration;
- stabilization-window scheduler;
- multi-window confidence;
- automated postmortem evidence;
- chaos testing;
- SLO recovery confirmation.
