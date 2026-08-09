# CrowMods AI — Phase 117: Fencing Tokens, Canary DLQ Replay, Delegation Lifecycle, Risk Forecasting & Signed Decisions

Phase 117 adds:
- fencing-token validation for worker locks
- canary-first DLQ replay
- automated delegation expiry/revocation evaluation
- risk trend forecasting
- signed executive decision evidence
- dashboard metrics
- regression tests
- smoke test

Production signing remains behind an approved KMS/HSM adapter. No credentials
or private keys are included.
