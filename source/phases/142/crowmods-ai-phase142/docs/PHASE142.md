# Phase 142

## Purge outcome transaction joins
Every purge outcome is tied to its run, record key, table, and originating
row-audit identifier.

## Alert transition history and cooldown-aware recovery
Recovery decisions respect active cooldowns and record every transition with
its reason and resulting cooldown.

## Lease validation inside atomic calibration
The checkpoint commit now requires a matching calibration binding and an
unexpired lease carrying the same owner and fencing version.

## Replay-cache cleanup metrics
Expired replay-cache entries can be removed in bounded cleanup runs, with
examined, removed, and conflict counts persisted.

## Security boundary
The calibration commit remains guarded by database-side ownership, fencing,
lease expiry, and checkpoint-version checks. Cleanup workers should use
bounded batches in production rather than unbounded cache scans.

## Next
Possible next work:
- purge outcome reconciliation against row-audit records;
- alert transition analytics and recovery SLOs;
- calibration lease renewal integrated with checkpoint commit;
- replay cache bounded deletion batches and conflict quarantine.
