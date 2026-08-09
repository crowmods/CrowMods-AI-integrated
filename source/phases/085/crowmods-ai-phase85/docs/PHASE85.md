# Phase 85 Runbook

## Multi-window forecasting

The service compares recent 3-, 7-, and 14-point windows and aggregates their
directional change.

This is a transparent baseline model, not a guarantee of future behavior.

## Anomaly detection

The anomaly score is based on deviation from historical mean relative to
historical standard deviation.

Confidence increases with history length.

## Alert deduplication

Alerts use a caller-provided dedupe key.

Repeated occurrences update the existing record rather than creating an
unbounded stream of duplicate alerts.

## Escalation

An alert escalates when:
- severity increases; or
- repeated occurrences reach the escalation threshold.

## Routing

Alert routing is abstracted behind AlertRouter.

The development implementation records routing events in memory.

Production routing should integrate with approved notification systems with:
- authentication;
- rate limits;
- retry policy;
- dead-letter handling;
- audit logging.

## Executive reports

Reports summarize:
- exercise volume;
- average resilience score;
- anomaly count;
- open alerts.

## Next

Possible next work:
- production notification adapters;
- anomaly suppression policies;
- statistical confidence intervals;
- advanced forecasting models;
- security hardening;
- observability integration.
