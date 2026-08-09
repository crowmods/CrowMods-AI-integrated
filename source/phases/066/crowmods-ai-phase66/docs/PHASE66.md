# Phase 66 Runbook

## Event architecture

Application/worker
-> event contract
-> durable event stream
-> consumers
-> incidents/analytics/operations

The included in-process EventBus is a development adapter. Production should
use a durable broker with persistence, consumer groups, replay and monitoring.

## Event contract

Each event should include:
- event ID;
- event type;
- source service;
- correlation ID;
- payload;
- occurrence timestamp.

Event IDs should be globally unique and consumers should be idempotent.

## Dependency graph

A dependency edge means the source service relies on the target service.

Example:

web -> api -> database

If the database fails, upstream services may be impacted.

The graph is a correlation aid, not proof of causality.

## Incident correlation

Use:
- service identity;
- dependency graph;
- event timestamps;
- correlation IDs;
- SLO signals.

Avoid declaring root cause from dependency topology alone.

## Production event bus

The adapter should support:
- durable retention;
- consumer groups;
- retries/dead-letter handling;
- replay;
- ordering where required;
- schema/version management;
- authentication and encryption;
- operational metrics.

## Security

Treat event payloads as untrusted data.

Do not:
- execute event payloads;
- permit arbitrary callback destinations;
- put secrets into payloads;
- trust client-provided service identity without authentication.

## Next

Possible next work:
- production broker adapter;
- schema registry/versioning;
- dead-letter queue;
- event replay tooling;
- dependency health scoring;
- cross-service incident correlation.
