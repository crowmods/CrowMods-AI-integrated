# CrowMods AI — Phase 69: Broker Adapter, Partitions & Worker Coordination

Adds the production-oriented broker/worker coordination contract.

Included:
- partition-aware event routing
- consumer-group assignment model
- partition ownership leases
- offset commits
- bounded worker concurrency
- retry/DLQ worker contract
- lag-based scaling signals
- broker adapter interface
- coordination APIs
- tests

The included in-memory broker is for development/testing. Production should
implement the adapter against the selected durable broker and use its native
partition, consumer-group and offset semantics.
