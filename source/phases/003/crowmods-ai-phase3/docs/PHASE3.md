# Phase 3 Notes

Pipeline:
PENDING_REVIEW -> PROCESSING -> PENDING_REVIEW

Security:
- APKs are untrusted.
- Inspection is read-only.
- Never invoke an uploaded APK.
- Deep analysis should run in isolated workers.
- Add archive-entry/decompression safeguards before production scale.

The current processor creates deterministic AI-ready content. A real model
adapter can be connected next.

Production gaps:
- Authentication and authorization
- PostgreSQL
- Queue workers
- Private object storage
- Malware scanning
- Rate limiting
- Audit logs
- CSRF protection
- Production secret management
