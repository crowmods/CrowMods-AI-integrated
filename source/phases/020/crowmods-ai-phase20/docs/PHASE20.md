# Phase 20 Security Boundary

The safe production flow is:

1. Browser requests an upload session.
2. API validates metadata and creates a quarantine record.
3. API returns a short-lived signed object-storage upload URL.
4. Browser uploads directly to private quarantine storage.
5. Object-storage event enqueues a scan job.
6. Isolated scanner verifies hash and performs static analysis.
7. Scanner writes evidence/verdict.
8. AI reads verified metadata/evidence and creates a draft.
9. Human reviewer approves/rejects.
10. Approved artifact is promoted to controlled distribution storage.
11. Publishing workers distribute it through authorized channels.

Never:
- execute an uploaded APK on the API server;
- install/test an uploaded APK on an administrator's personal device;
- claim a scanner result without evidence;
- automatically publish a suspicious/malicious artifact;
- bypass copyright, licensing, or platform restrictions.

For app/mod distribution, maintain a provenance record containing publisher,
source/authorization information, hash, version, scan evidence and approval
history.
