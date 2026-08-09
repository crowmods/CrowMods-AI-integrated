# Phase 64 Runbook

## Escalation processing

Incident
-> escalation job
-> worker claim/lease
-> timeout evaluation
-> notification
-> escalation level update
-> timeline event

Resolved incidents cancel pending escalation work.

## Reliability

The worker uses:
- PostgreSQL-backed queue;
- leases;
- bounded attempts;
- exponential retry;
- idempotent state transitions.

For high-volume production, move the queue to an appropriate durable queue
system while retaining the same incident/job IDs and idempotency contract.

## Notification delivery

Every delivery should record:
- provider;
- destination reference;
- status;
- attempt count;
- provider reference;
- error;
- timestamp.

Do not store notification secrets in the delivery record.

## Timeout

ACK timeout is configurable. The default is a development example, not a
universal on-call standard.

Production timeout should follow the organization's incident policy.

## Maximum escalation

When maximum escalation is reached, the worker records a commander escalation
event rather than inventing an unapproved remediation action.

## Security

The worker must not:
- execute arbitrary shell commands from alerts;
- accept credentials from incident payloads;
- modify firewall/IAM/security controls automatically;
- disclose sensitive incident data to unapproved notification destinations.

## Next

Possible next work:
- real paging provider;
- scheduled on-call rotation engine;
- notification retry delivery;
- escalation policy UI;
- incident postmortem automation;
- event-driven alert-to-escalation integration.
