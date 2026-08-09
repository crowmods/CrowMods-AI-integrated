# Phase 147

## Dead-letter re-drive
Dead-letter items can be re-driven only with an authenticated actor,
explicit reason, and a remaining attempt budget.

## Burn-rate severity tiers
Burn rates are classified into NORMAL, ELEVATED, HIGH, and CRITICAL tiers.

## Lease conflict baseline/trend detection
Observed conflict rates can be compared with a baseline to detect elevated
behavior and spikes.

## Immutable evidence chain
Quarantine evidence entries are linked by hashes. Verification walks the
chain in creation order and detects tampering.

## Security boundary
Re-drive authorization should be tied to application permissions. Evidence
chains should contain non-sensitive metadata and hashes rather than secrets.

## Next
Possible next work:
- dead-letter approval policies and replay safeguards;
- burn-rate tier escalation/hysteresis;
- adaptive lease-conflict baselines;
- evidence-chain anchoring and closure verification reports.
