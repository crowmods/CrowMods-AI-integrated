# Phase 114 — KMS Adapters, Worker Leases/Retries, Risk Acceptance & Assurance Forecasting

## KMS provider adapters

Supported adapter contracts:
- AWS KMS;
- Azure Key Vault;
- Google Cloud KMS;
- generic HSM.

The application stores provider metadata and key references, not private keys.

Production implementations must use the approved provider SDK/API and
identity mechanism.

## Durable worker leases

A scheduled control-test job can be claimed by one worker using a time-bound
lease.

If a worker disappears, the lease expires and another worker can safely
reclaim the job according to the production queue semantics.

## Retry policy

Retries use bounded exponential backoff.

The policy supports:
- maximum attempts;
- base delay;
- maximum delay.

Production workers should add jitter to reduce synchronized retries.

## Risk acceptance

A risk acceptance records:
- risk statement;
- owner;
- approval state;
- expiry.

Expired approvals are inactive and must not be treated as authorization to
ignore a security control.

## Assurance forecasting

The forecast projects the assurance score from:
- current score;
- slope per period;
- horizon.

Statuses:
- IMPROVING;
- STABLE;
- DECLINING;
- AT_RISK.

Forecasts are decision-support signals, not replacements for component-level
security controls.

## Security boundary

Risk acceptance never bypasses a hard security requirement. Critical
security controls should remain fail-closed even when a business risk has
been accepted.

## Next

Possible next work:
- real provider SDK adapters;
- distributed worker locking;
- retry jitter and dead-letter queues;
- risk acceptance approval chains;
- assurance trend analytics and executive risk register integration.
