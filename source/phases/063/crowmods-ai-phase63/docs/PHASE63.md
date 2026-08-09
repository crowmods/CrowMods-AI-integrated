# Phase 63 Runbook

## Alert routing

Alert
-> route by service/severity
-> deduplicate
-> assign primary
-> notify
-> acknowledge
-> resolve OR escalate

## Deduplication

A deterministic key prevents repeated alert events from creating unlimited
duplicate incidents.

Choose the key carefully. Different independent failures should not collapse
into one incident.

## Escalation

A basic policy can use:
- primary notification;
- secondary escalation;
- incident commander;
- security escalation for security/data events.

Production timeout values should be based on the organization's actual
on-call policy.

## Notification provider

The sample provider writes to the console. Production should implement an
approved provider adapter for paging/chat/email.

Credentials belong in a secrets manager and must never be supplied by an AI
model, browser client or incident text.

## Acknowledgment

Acknowledgment means an owner has accepted responsibility. It does not mean
the incident is fixed.

## Resolution

Resolve only after service health and the relevant failure condition have
been verified.

## Security incidents

Security/data-risk events should follow the organization's incident-response
policy. Preserve evidence, restrict access and rotate compromised credentials
when appropriate.

## Next

Possible next work:
- real paging provider adapter;
- scheduled on-call rotations;
- automatic timeout-based escalation worker;
- SLO burn-rate alert routing;
- incident postmortem automation;
- notification delivery tracking.
