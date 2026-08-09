# Phase 141

## Row-level purge audit binding
Every purge row can be linked directly to its run, table, record key,
retention policy, and action.

## Alert-cap state machine
Alert state is modeled explicitly across NORMAL, WARNING, CRITICAL, CAPPED,
and RECOVERING states.

## Atomic calibration binding/checkpoint commit
The database commit requires both the expected checkpoint version and the
matching calibration binding. Audit information is written in the same
transaction.

## Manifest replay response cache
Repeated verification requests can receive a cached response without
reprocessing the same export. Entries expire automatically.

## Security boundary
Replay caching should be scoped to the verification operation and export
identity. Production cache cleanup should be bounded and audited.

## Next
Possible next work:
- purge audit transaction joins with deletion outcomes;
- alert state transition history and cooldown-aware recovery;
- calibration fencing lease validation inside the atomic commit;
- replay cache conflict detection and cleanup metrics.
