# Phase 67 Runbook

## Event envelope

Every event should have:
- unique event ID;
- event type;
- schema version;
- source service;
- correlation ID;
- timestamp;
- payload.

## Schema registry

Schemas should be versioned and compatibility should be enforced before
production consumers are upgraded.

A schema change should not silently break existing consumers.

## Consumer groups

Each consumer group should maintain its own progress. Consumers should be
idempotent because retries and replays are expected.

## Retry and DLQ

Delivery failure:
-> retry with bounded backoff
-> maximum attempts
-> dead-letter queue

DLQ items should be investigated before replay.

## Replay

Replay is a controlled operational action. Record:
- event ID;
- consumer group;
- requester;
- reason;
- status;
- completion time.

Do not replay sensitive events into an unauthorized environment.

## Production broker

The broker adapter should provide:
- durable persistence;
- consumer groups;
- acknowledgments;
- retries;
- dead-letter handling;
- replay;
- encryption in transit;
- authentication;
- monitoring;
- retention controls.

The local broker in this phase is not a substitute for a production broker.

## Security

Validate event schemas before processing. Treat event payloads as untrusted.
Never execute payload content as code or commands.

## Next

Possible next work:
- real Kafka/NATS/cloud broker adapter;
- schema compatibility engine;
- consumer worker framework;
- DLQ management UI;
- event replay worker;
- event throughput/lag monitoring.
