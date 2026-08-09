# CrowMods AI — Phase 107: Multi-Window Burn Rates, Budget Policy & Failover Safety

Phase 107 builds on Phase 106 with:
- multi-window burn-rate evaluation
- error-budget policy decisions
- safe provider failover state machine
- security reliability report generation
- policy audit records
- tests and smoke test

The failover model is deliberately fail-closed for security-sensitive
dependencies. It never silently weakens authentication, authorization,
cryptographic verification, or evidence integrity.
