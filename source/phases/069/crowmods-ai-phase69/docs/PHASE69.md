# Phase 69 Runbook

## Partition model

A topic can be divided into partitions for parallel processing.

The event key should consistently map to the same partition when ordering by
key is required.

## Consumer groups

A consumer group shares work across workers. A partition should have one active
owner within a group at a time.

Use broker-native assignment where available.

## Leases

Partition ownership should expire when a worker stops heartbeating. The broker
or coordinator can then assign the partition to another healthy worker.

## Offset commits

Commit offsets only after processing succeeds according to the consumer's
delivery contract.

Use monotonic commits so an old worker cannot move an offset backwards.

## Scaling

Lag is an input to scaling decisions.

High lag:
-> calculate desired worker count
-> compare against partition count
-> scale within configured limits.

Do not scale indefinitely. Partition count and downstream capacity impose hard
limits.

## Production broker

Implement the BrokerAdapter against the selected durable system.

The adapter should support:
- topic creation;
- publishing;
- partitioning;
- consumer groups;
- assignment;
- fetch;
- acknowledgments;
- offset commits;
- retries;
- DLQ;
- replay.

## Security

Authenticate broker clients and encrypt connections. Authorize consumers by
topic/group. Never put credentials in event payloads.

## Next

Possible next work:
- production Kafka/NATS/cloud adapter;
- partition rebalancer;
- DLQ executor;
- lag alerting;
- autoscaling integration;
- broker observability.
