# Phase 118 — Fencing Enforcement, Canary Promotion Gates, Delegation Revocation, Forecast Confidence & Signed Evidence Bundles

## Fencing enforcement

Phase 117 validated fencing tokens. Phase 118 adds a request-level
enforcement middleware.

Protected operations require:
- resource key;
- current fencing version;
- active token;
- unexpired token.

Stale or expired workers receive a conflict response instead of executing.

## Canary promotion gates

Canary replay must pass:
- schema validation;
- dependency health;
- target availability;
- rollback readiness;
- observability readiness.

Promotion also requires explicit authorization.

## Delegation revocation

Expired delegations are detected and routed to a revocation job. Already
revoked delegations are skipped.

Production deployments should run this evaluation as a scheduled worker.

## Forecast confidence

Risk forecasts now expose:
- projected score;
- lower bound;
- upper bound;
- confidence;
- horizon.

The interval is a decision-support approximation, not a statistical
guarantee.

## Signed governance evidence bundles

A governance bundle packages a manifest and evidence references, computes a
canonical SHA-256 digest, and signs the digest.

The included signer is a development adapter only. Production deployments
must use the approved KMS/HSM signing service.

## Security boundary

Runtime enforcement remains authoritative. Governance approvals, risk
acceptance, and forecasts cannot bypass technical security controls.

## Next

Possible next work:
- fencing token propagation to downstream resources;
- automated canary rollout/rollback;
- scheduled delegation revocation worker;
- forecast calibration from historical errors;
- production KMS-backed bundle signatures.
