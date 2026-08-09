# Phase 148

## Dead-letter approval policies
Redrive requires explicit policy enablement, an approval threshold, a
remaining redrive budget, an actor, and a reason.

## Replay safeguards
Replay requests are checked against export identity plus optional payload and
manifest hashes. Conflicts are recorded instead of silently replayed.

## Burn-rate hysteresis
Severity transitions require consecutive breach/recovery cycles, reducing
flapping around thresholds.

## Adaptive lease baselines
Conflict baselines are updated using an exponential moving average so normal
behavior can evolve without replacing historical context abruptly.

## Evidence-chain anchoring
A chain head can be anchored with a versioned hash that incorporates the
previous anchor, chain head, quarantine identity, and actor.

## Closure verification reports
Verification results are persisted as hashed reports for later audit.

## Security boundary
Approval actors must be authenticated and authorized by the application.
Replay safeguards must fail closed on identity/hash conflicts. Evidence
records should contain metadata or references rather than secrets.

## Next
Possible next work:
- multi-approver quorum history and approval expiry;
- replay safeguard rate limits and quarantine escalation;
- hysteresis policy versioning;
- baseline drift bounds and reset controls;
- external evidence-anchor verification adapters.
