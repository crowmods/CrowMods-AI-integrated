# Phase 117 — Fencing Tokens, Canary DLQ Replay, Delegation Lifecycle, Risk Forecasting & Signed Decisions

## Fencing tokens

Fencing tokens prevent a stale worker from continuing to operate after its
lease has been replaced.

A worker must present the current token version. Stale versions are rejected.

Production implementations should persist and enforce the token at the
resource boundary, not only inside the scheduler.

## Canary DLQ replay

DLQ replay starts with a small canary validation.

Checks include:
- schema validity;
- dependency health;
- target availability.

A failed canary does not proceed automatically.

## Delegation lifecycle

Delegations are evaluated as:
- PENDING;
- ACTIVE;
- EXPIRED;
- REVOKED.

Expired delegations must not remain usable.

## Risk forecasting

Historical risk movement can be projected using a slope and horizon.

Statuses:
- IMPROVING;
- STABLE;
- WORSENING;
- CRITICAL.

Forecasts are advisory and should be combined with actual risk-register
controls.

## Signed executive decision evidence

Executive decisions can be packaged with evidence references, canonicalized,
hashed, and signed.

The development signer is intentionally not a production cryptographic
implementation. Production must use the approved KMS/HSM adapter.

## Security boundary

No governance workflow automatically disables a technical control. Risk
decisions remain separate from enforcement.

## Next

Possible next work:
- fencing enforcement middleware;
- canary replay promotion gates;
- automatic delegation revocation jobs;
- risk forecast confidence intervals;
- signed governance evidence bundles.
