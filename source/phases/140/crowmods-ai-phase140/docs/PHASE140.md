# Phase 140

## Locked-row purge delete transactions
The database exposes allowlisted delete handlers using retention predicates,
row locks, and `SKIP LOCKED` so concurrent purge workers can safely claim
different records.

## Alert cap reset windows
Escalation counts are bounded by a configurable cap and automatically reset
after a defined window.

## Calibration binding CAS
Calibration binding can be committed with an expected fencing version,
preventing stale owners from replacing a newer binding.

## Idempotent manifest retry/replay audit
Repeated verification requests with the same idempotency key are replayed
instead of duplicated. Reuse of the key for another export is classified as
a conflict and every decision is audited.

## Security boundary
Production purge execution should retain explicit table handlers, database
permissions, and transaction boundaries. Idempotency keys should be scoped to
the export-verification operation.

## Next
Possible next work:
- row-level purge audit entries tied directly to deleted keys;
- alert cap state-machine persistence and recovery metrics;
- calibration binding plus checkpoint write in one transaction;
- manifest replay response caching and failure retry policy.
