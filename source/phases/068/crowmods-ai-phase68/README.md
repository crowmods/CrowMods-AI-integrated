# CrowMods AI — Phase 68: Consumer Workers, DLQ Management & Event Lag

Adds the consumer-processing layer on top of Phase 67.

Included:
- consumer group registry
- consumer worker contract
- offset management
- idempotent event processing
- delivery attempts
- DLQ processing
- controlled replay worker contract
- consumer lag/throughput metrics
- consumer health API
- operations dashboard foundation
- tests

The worker implementation is intentionally provider-neutral. Production should
connect it to the selected durable event broker and use a persistent offset
store with the same semantics.
