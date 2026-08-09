# CrowMods AI — Phase 71: Recovery-to-Incident Integration & Autoscaling Signals

Connects consumer lag/recovery signals to the incident pipeline and capacity
planning layer.

Included:
- lag-alert to incident bridge
- recovery-aware incident correlation
- autoscaling recommendation engine
- worker capacity bounds
- scale-out/hold/scale-in signals
- recovery verification
- incident closure integration
- capacity observability API
- operations dashboard foundation
- tests

Scaling output is a recommendation signal. Actual infrastructure scaling must
be performed by an approved autoscaling provider/controller with authorization,
limits and rollback safeguards.
