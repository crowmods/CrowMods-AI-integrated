# Phase 113 — Production KMS Verification, Durable Scheduling, Risk Prioritization & Executive Assurance

## KMS verification boundary

Phase 112 used a development verifier. Phase 113 defines the production
adapter boundary.

The production implementation should:
- call the approved KMS/HSM verification service;
- validate key reference;
- validate algorithm;
- validate signature;
- record verification latency;
- fail closed when the verifier is unavailable.

No cloud credentials or private keys belong in application configuration.

## Durable control-test scheduler

Control tests receive deterministic idempotency keys.

The database unique constraint prevents duplicate jobs for the same control
and scheduled timestamp.

Job lifecycle:
SCHEDULED → RUNNING → SUCCEEDED / FAILED

Production workers should use leases, retry limits, and dead-letter handling.

## Risk-based prioritization

Priority combines:
- likelihood;
- impact;
- exposure;
- control effectiveness weakness.

The score supports prioritization; it is not a substitute for formal risk
acceptance.

## Executive assurance score

The score combines:
- evidence verification;
- control effectiveness;
- governance coverage;
- reliability;
- risk posture.

Status:
- STRONG;
- WATCH;
- WEAK;
- INSUFFICIENT_DATA.

Weights should be configurable by the organization's risk committee.

## Security boundary

A high assurance score must never override a specific critical security
failure. Component-level controls and fail-closed decisions remain authoritative.

## Next

Possible next work:
- real KMS provider adapters;
- scheduler worker leases and retries;
- risk acceptance workflows;
- assurance score history and trend forecasting;
- executive risk register integration.
