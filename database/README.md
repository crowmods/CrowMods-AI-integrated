# Database integration status

All phase SQL is preserved under `source/phase-NNN/` and mapped by
`source-manifest.json`.

The source set contains multiple incompatible re-definitions of tables.
Therefore the SQL is intentionally NOT concatenated into a supposedly
production-safe migration. `duplicate-table-report.json` documents the
known duplicate definitions. A semantic schema reconciliation is required
before applying a single production database migration.
