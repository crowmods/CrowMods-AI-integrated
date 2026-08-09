# Phase 77 Runbook

## Evidence integrity

Evidence
-> canonical representation
-> SHA-256 digest
-> signed evidence record
-> later verification.

The sample uses a digest-based integrity marker. It is not a substitute for
cryptographic signatures or a trusted key-management system when those are
required.

## Audit chain

Each record contains:
- previous hash;
- event type;
- payload;
- actor;
- event hash;
- timestamp.

The chain can detect modification or deletion/reordering within the exported
sequence when anchored to a trusted checkpoint.

## Immutable export

The API produces a structured export package containing signed evidence and
audit records.

Production should send exports to controlled immutable/WORM storage and retain
an external trust anchor.

## Provider contracts

Incident and SLO integrations use explicit interfaces so production adapters
can be added without coupling core recovery logic to a single vendor.

## Security

Use managed keys for real cryptographic signatures. Protect audit exports with
access controls and retention policies.

Do not treat a database hash chain as a complete tamper-proof ledger.

## Next

Possible next work:
- real incident provider adapter;
- real SLO provider adapter;
- cryptographic signatures with managed keys;
- WORM/object-lock audit export;
- end-to-end closure certification.
