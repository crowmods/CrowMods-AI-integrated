# Phase 149

## Multi-approver quorum
Approvals are counted by unique actor and only active, unexpired approvals
satisfy the configured quorum.

## Replay rate limits
Replay requests are counted per idempotency key and transition from ALLOW to
THROTTLED to ESCALATED as configured limits are exceeded.

## Versioned hysteresis policies
Hysteresis thresholds are stored as versioned policies so changes can be
audited and rolled forward without mutating historical versions.

## Adaptive baseline drift controls
Baseline movement is bounded by a configurable maximum step and rate limits,
preventing sudden observations from replacing the baseline abruptly.

## External evidence verification adapter
The verification layer exposes an adapter interface and persists the adapter
result. Deployments should register a trusted adapter through application
configuration rather than accepting executable code from requests.

## Security boundary
The sample adapter endpoint is intentionally fail-closed when no trusted
adapter is configured. Production implementations should authenticate
operators, rate-limit replay checks, and isolate external verification
adapters.

## Next
Possible next work:
- quorum approval expiry workers and revocation;
- replay rate-limit sliding windows;
- hysteresis policy rollout/rollback controls;
- adaptive baseline confidence intervals;
- signed external evidence attestations.
