# Phase 61 — Launch Operations Runbook

## Purpose

Phase 60 established the launch package. Phase 61 adds an operational control
surface for the launch window and the first hours/days after release.

## Launch ownership

Assign:
- release owner;
- incident commander;
- support owner;
- technical on-call;
- security contact.

Avoid a launch where responsibility is unclear.

## SLO monitoring

Monitor the actual service baseline and agreed SLOs.

Suggested dimensions:
- availability;
- error rate;
- p95/p99 latency;
- queue backlog;
- worker success rate;
- database latency;
- authentication failures;
- external provider error rate.

The sample thresholds are only defaults and must be tuned to real SLOs.

## Launch timeline

Record:
- canary started;
- canary promoted;
- traffic changes;
- migrations;
- incidents;
- mitigations;
- rollback;
- recovery;
- launch completion.

This creates an auditable timeline for the release review.

## Rollback recommendation

The system can recommend `INVESTIGATE_OR_ROLLBACK`, but a consequential
production rollback should follow the approved deployment policy unless an
explicit automated rollback policy has been reviewed and enabled.

## Post-launch review

Within the agreed review window:
- compare actual metrics to baseline;
- review incidents;
- review support volume;
- inspect AI-worker errors;
- inspect provider failures;
- confirm backups;
- document lessons;
- close or extend heightened monitoring.

## Security

Do not put secrets, access tokens, payment data or unnecessary personal data
into launch notes or incident timeline messages.

## Next

Possible future work:
- real deployment-provider adapter;
- live metric ingestion;
- on-call integrations;
- SLO burn-rate alerts;
- post-launch analytics;
- automated evidence collection.
