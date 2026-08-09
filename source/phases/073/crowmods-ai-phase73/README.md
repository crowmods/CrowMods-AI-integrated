# CrowMods AI — Phase 73: Capacity Telemetry, Hysteresis & Verification Loop

Adds live capacity signals and a guarded scaling verification loop.

Included:
- capacity telemetry ingestion
- separate scale-out/scale-in thresholds
- hysteresis decision engine
- cooldown state
- post-change verification
- rollback recommendation
- recovery verification records
- capacity metrics API/dashboard foundation
- tests and smoke test

The controller remains provider-neutral. Production infrastructure changes
must be performed by an approved autoscaling provider/controller.
