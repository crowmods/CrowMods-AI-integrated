# Phase 138

## Transaction-safe SQL purge executor
The purge operation is wrapped in a database transaction and uses an
allowlisted table boundary. Audit accounting commits atomically with the
execution result.

## Alert escalation recovery and hysteresis
Critical alerts can recover to warning after repeated healthy cycles, while
warning alerts can reset to normal after sustained recovery.

## Fenced calibration audit joins
Calibration writes can be correlated with model, owner, fencing version, and
checkpoint version.

## Transactional manifest verification
Manifest verification and its audit record are committed together, preventing
a successful response from being emitted without its verification record.

## Security boundary
The SQL purge function intentionally remains a policy boundary and does not
interpolate arbitrary identifiers. Production table handlers should remain
explicit and parameterized.

## Next
Possible next work:
- row-level SQL purge locks and eligibility predicates;
- alert recovery cooldowns and escalation caps;
- calibration lease-to-checkpoint transaction binding;
- manifest verification idempotency keys and retry handling.
