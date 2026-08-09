# Phase 97 Runbook

## Automated access reviews

The generator identifies subjects whose access has become stale based on
last-seen time.

A real deployment should feed this from:
- identity provider activity;
- application activity;
- privileged access logs;
- employment/ownership systems where appropriate.

## Privileged-action anomaly detection

The scoring model considers:
- privileged role count;
- action volume;
- denied actions;
- unusual resources;
- after-hours activity.

The score is a deterministic triage signal, not a final security verdict.

## Policy conflict analysis

The analyzer detects directly opposing ALLOW/DENY policies with the same
resource, action, and required role set.

More advanced production analysis should include:
- role inheritance;
- wildcard resources;
- scope intersections;
- priority semantics;
- conditional policies.

## Governance evidence

Evidence is represented with a SHA-256 digest so exported governance data can
be integrity-checked.

For production:
- use canonical serialization;
- include source event identifiers;
- sign evidence with managed KMS/HSM;
- store the artifact immutably.

## Next

Possible next work:
- alert workflow and triage;
- privileged session monitoring;
- policy graph analysis;
- signed governance evidence bundles;
- final security hardening and release validation.
