# Phase 136

## SQL-level purge eligibility
A database function provides a canonical retention-expiry check so application
logic cannot redefine the eligibility rule independently.

## Alert deduplication and cooldowns
Repeated baseline alerts can be suppressed while an alert key remains inside
its cooldown period. Trigger counts are persisted.

## Calibration lease CAS
Calibration ownership now supports database compare-and-swap acquisition and
renewal with fencing versions.

## Scheduled manifest re-verification batches
Re-verification requests are bounded into batches and audited, providing a
foundation for a scheduler to process stored exports incrementally.

## Security boundary
Production purge workers should use parameterized, allowlisted handlers and
database permissions. Cooldowns reduce duplicate alert noise but do not replace
incident tracking.

## Next
Possible next work:
- transactional SQL purge eligibility enforcement per row;
- alert cooldown escalation and reset rules;
- calibration lease fencing on checkpoint writes;
- actual scheduled manifest verification workers.
