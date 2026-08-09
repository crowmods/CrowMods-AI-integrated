# CrowMods AI — Phase 66: Event Streaming & Service Dependency Graph

Adds a provider-neutral event bus and dependency-aware operations layer.

Included:
- event bus abstraction
- durable event records
- consumer offsets
- service dependency graph
- dependency-aware incident correlation
- impact propagation
- event replay contract
- unified operations API
- dependency graph dashboard foundation
- integration tests

The included in-process broker is intended for development/testing. Production
should connect the same event contract to an approved durable streaming system
such as Kafka, NATS JetStream, or a cloud-native equivalent.
