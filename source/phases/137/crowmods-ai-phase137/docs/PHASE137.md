# Phase 137

## Transactional SQL purge enforcement
A canonical database eligibility function is provided so purge workers can
use the same retention boundary as the database policy.

## Alert cooldown escalation and reset
Repeated warning conditions can escalate to critical state. Normal state
explicitly resets the alert state.

## Fenced calibration checkpoint writes
Checkpoint writes require an exact checkpoint version and a valid, unexpired
calibration lease with matching owner and fencing version.

## Manifest verification worker
Verification requests are processed as bounded worker batches and each worker
run is audited.

## Security boundary
The worker batch is intentionally bounded. Production verification workers
should fetch only authenticated, allowlisted export records and persist each
individual verification result.

## Next
Possible next work:
- SQL transactional purge executor with row locks;
- alert escalation recovery and hysteresis;
- fenced calibration write audit joins;
- actual manifest verification processing inside worker transactions.
