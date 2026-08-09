# Phase 17 Security Notes

The queue is a control plane, not an execution sandbox.

Production workers should:
- use least-privilege database credentials;
- claim only permitted job types;
- run untrusted-file analysis in isolated containers/VMs;
- have no unnecessary network access;
- enforce CPU, memory, disk and time limits;
- never execute uploaded APKs;
- write structured results back to the database/object store;
- be monitored and restartable;
- use idempotency keys for publishing operations.

For higher scale, Redis/BullMQ, SQS, Pub/Sub, or another managed queue can
replace or complement PostgreSQL polling while keeping the same job contract.
