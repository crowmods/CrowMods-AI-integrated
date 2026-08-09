# Phase 106 — Error Budgets, Burn Rates & Provider Adapters

## Error budgets

An SLO target defines an allowed failure percentage.

For a 99.9% SLO:
- allowed failure = 0.1%.

The budget tracks:
- allowed failure;
- observed failure;
- remaining budget;
- budget status.

## Burn rate

Burn rate compares the observed failure rate with the failure rate permitted
by the SLO.

Example:
- SLO: 99%;
- permitted failure: 1%;
- observed success: 98%;
- observed failure: 2%;
- burn rate: 2x.

Large burn rates should alert before the budget is fully exhausted.

## Provider adapters

### Workload identity

The adapter contract isolates:
- provider;
- issuer;
- audience;
- exchange;
- validation.

Production implementations should use short-lived workload credentials.

### TLS

The live connector requires an explicit destination allowlist.

Production implementations should:
- use a trusted CA bundle;
- verify hostname;
- enforce timeouts;
- limit destinations;
- avoid arbitrary outbound connections.

### KMS

The production adapter contract isolates:
- provider;
- key ID;
- algorithm;
- signing;
- verification.

Private keys remain inside KMS/HSM.

## Operational principle

Burn-rate alerts are signals, not automatic authorization bypasses.

Security controls must remain fail-closed when identity, KMS, SIEM, or TLS
dependencies are unhealthy.

## Next

Possible next work:
- multi-window burn-rate alerting;
- error-budget policy automation;
- provider-specific workload identity implementations;
- production TLS connector;
- production KMS adapter;
- security reliability reports.
