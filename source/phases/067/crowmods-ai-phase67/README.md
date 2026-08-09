# CrowMods AI — Phase 67: Production Event Bus, Schemas, Replay & DLQ

Adds the production-oriented event infrastructure contract.

Included:
- versioned event schemas
- schema validation
- event envelope
- provider-neutral durable broker adapter
- consumer-group contract
- retry policy
- dead-letter queue contract
- replay API
- event audit trail
- schema compatibility checks
- event operations dashboard foundation
- tests

The included broker adapter is an interface and local development
implementation. It does not claim a production broker is configured.
