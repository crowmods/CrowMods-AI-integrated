# Phase 68 Runbook

## Consumer lifecycle

Event
-> consumer group
-> claim/read
-> process
-> record idempotency
-> advance offset
-> record delivery metrics

A failed event must not advance the offset until the consumer's processing
contract permits it.

## Idempotency

The `processed_events` table demonstrates an idempotency key:
consumer group + event ID.

Production consumers should use an equivalent durable mechanism.

## Consumer lag

Lag can be measured by comparing the latest event timestamp/offset with the
consumer's last successfully processed position.

For high-volume systems, prefer broker-native offsets and lag metrics.

## DLQ

A DLQ event requires investigation before replay.

Replay should record:
- requester;
- reason;
- consumer group;
- event ID;
- replay status.

## Worker scaling

Multiple workers can share a consumer group when the broker provides proper
partitioning/claim semantics.

The sample PostgreSQL worker is intentionally simple and is not a replacement
for a mature production broker's consumer-group implementation.

## Monitoring

Track:
- consumer lag;
- throughput;
- processing latency;
- retry rate;
- DLQ rate;
- worker health;
- offset progress.

## Security

Do not allow event payloads to execute arbitrary commands. Validate event
schemas and authorize consumers to access only the topics they need.

## Next

Possible next work:
- real broker consumer adapter;
- partition-aware workers;
- DLQ worker;
- replay executor;
- consumer autoscaling;
- lag-based alerts.
