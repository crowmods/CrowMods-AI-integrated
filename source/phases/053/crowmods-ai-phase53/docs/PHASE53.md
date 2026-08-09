# Phase 53 Notes

## Production execution

AI workflow task
-> worker queue
-> claim with lease
-> authorization/tool check
-> model/provider call
-> registered tool
-> verification
-> success OR retry
-> audit

## Durable queue

The worker uses PostgreSQL as a zero-cost development queue. For larger
production workloads, move the same contract to Redis, RabbitMQ, SQS or another
durable queue while keeping job IDs and idempotency.

## Retry policy

Use bounded exponential backoff. Never retry indefinitely.

For provider errors, classify:
- transient -> retry;
- rate limited -> provider-aware delay;
- authentication failure -> stop and alert;
- permission denied -> stop and request authorization;
- validation failure -> stop;
- destructive/ambiguous result -> require review.

## Tool registry

Every tool has:
- name;
- permission;
- risk level;
- approval requirement;
- timeout.

The worker must never execute an arbitrary tool name supplied by a model.

## Model providers

Use an adapter so the orchestration layer is independent of one provider.
Credentials should come from a secrets manager and never be committed to the
repository.

## Zero-cost development

The mock provider allows local development without an AI API bill. Production
AI inference and external APIs may incur costs.

## Next

Build the secrets manager integration, real model-provider adapters, provider
rate-limit handling, idempotency, observability/SIEM export and production
deployment.
