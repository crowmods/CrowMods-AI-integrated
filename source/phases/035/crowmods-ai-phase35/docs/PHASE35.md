# Phase 35 Notes

## Release workflow

1. SECURITY_SCAN
2. AI_METADATA
3. APPROVAL_GATE
4. PUBLIC_RELEASE
5. CAMPAIGN_PREPARATION
6. PUBLISH_QUEUE
7. ANALYTICS

High-impact steps remain approval-gated.

## Production architecture

Use a durable workflow/message system such as a managed queue or workflow
engine rather than relying on in-process memory.

Workers should be:
- isolated;
- idempotent;
- least-privileged;
- retry-limited;
- observable;
- independently deployable.

Every event should have:
- unique identity/idempotency key;
- timestamp;
- aggregate reference;
- bounded retry policy;
- dead-letter handling.

## AI authority model

AI may:
- classify;
- summarize;
- draft;
- recommend;
- prioritize.

AI should not independently:
- publish unapproved releases;
- change payment settings;
- delete accounts;
- disable security controls;
- access secrets;
- bypass platform policies.

The orchestrator is the control plane; deterministic policy gates remain the
source of authority.
