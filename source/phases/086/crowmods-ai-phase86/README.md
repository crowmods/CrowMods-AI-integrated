# CrowMods AI — Phase 86: Alert Integrations, Observability & Policy Correlation

Adds a production-oriented alert operations layer while keeping external
notification providers behind explicit adapters.

Included:
- notification provider contract
- development notification provider
- retry queue / DLQ model
- suppression windows
- observability metrics
- anomaly policy engine
- SLO-aware alert correlation
- operational alert center
- tests and smoke test

No external notifications are sent by the development provider.
