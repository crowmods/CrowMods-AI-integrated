# Phase 16 Notes

The command center is an orchestration UI, not a replacement for the
individual security boundaries.

Production architecture:
- Admin UI
- API gateway
- Authentication/authorization service
- Release service
- AI processing service
- isolated scanning workers
- object storage
- PostgreSQL
- durable job queue
- platform connectors
- analytics pipeline
- monitoring/alerting

Every sensitive operation must still enforce authorization in the backend.
Do not trust UI buttons as a security control.
