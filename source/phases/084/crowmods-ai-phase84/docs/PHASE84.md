# Phase 84 Runbook

## Scheduler

The scheduler abstraction supports recurring exercise plans.

Supported example cadences:
- hourly;
- daily;
- weekly;
- monthly.

The included scheduler is application-level and safe for simulation.

## Exercise history

Exercise runs record:
- status;
- resilience score;
- timestamps;
- metadata.

This enables historical trend analysis.

## Capacity forecasting

Forecasting uses a simple linear trend over recent capacity/resilience scores.
It is intentionally transparent and deterministic.

Forecasts are bounded to the 0–1 score range.

## Degradation alerts

An alert is generated when the current score is at or above the baseline
threshold while the forecast falls below it.

## Production forecasting

For production, consider:
- seasonality;
- workload forecasts;
- confidence intervals;
- missing-data handling;
- region-specific models;
- anomaly detection.

## Safety

Automated scheduling must not implicitly authorize production chaos or
traffic changes. Exercise execution should remain behind the existing approval
and scope gates.

## Next

Possible next work:
- production scheduler adapter;
- advanced forecasting;
- anomaly detection;
- resilience alert routing;
- capacity planning;
- security hardening.
