# Phase 120 — Cryptographically Bound Fencing, Canary Orchestration, Durable Scheduling, Forecast Intervals & KMS Verification

## Cryptographically bound fencing

The downstream fencing envelope binds:
- resource identity;
- fencing version;
- payload digest;
- expiry;
- signature.

Changing the payload or fencing version invalidates the envelope.

## Canary rollout orchestration

The rollout state machine is:

PRECHECK
→ CANARY
→ OBSERVE
→ PROMOTING
→ PROMOTED

or:

OBSERVE
→ ROLLING_BACK
→ ROLLED_BACK

Failed prechecks enter FAILED.

## Durable delegation scheduling

Delegation expiry jobs can be persisted with unique run keys and claimed by
workers only after their scheduled time.

A production worker should use a database transaction or queue claim primitive
to guarantee single ownership.

## Forecast confidence intervals

Historical residuals are used to build empirical prediction intervals.
Empirical coverage can then be measured against actual outcomes.

This is a calibration/monitoring mechanism, not a guarantee of future
coverage.

## KMS verification

Signature verification is isolated behind a provider-neutral adapter.

The application does not store private keys. Provider implementations should
call the organization's approved KMS/HSM verification API.

## Security boundary

The assurance system remains fail-closed around fencing and signing. Forecast
and governance components do not override runtime security controls.

## Next

Possible next work:
- transactional downstream envelope verification;
- multi-stage traffic progression and automatic rollback;
- queue-backed delegation claims;
- conformal/quantile forecast calibration;
- provider-specific AWS/Azure/GCP KMS adapters and certificate/key rotation.
