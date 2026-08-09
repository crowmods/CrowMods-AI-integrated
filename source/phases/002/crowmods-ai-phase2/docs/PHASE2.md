# Phase 2 Security Notes

The upload service:
- never executes an uploaded APK;
- generates a random server-side filename;
- validates the extension;
- checks the ZIP/APK magic bytes;
- limits upload size;
- calculates SHA-256;
- detects exact duplicates;
- keeps the file in quarantine;
- marks the release PENDING_REVIEW.

Before production:
1. Put uploads behind authenticated admin access.
2. Store quarantine outside the public web root/object bucket.
3. Add malware scanning.
4. Add archive-bomb and decompression safeguards.
5. Add rate limits.
6. Add audit logs.
7. Add isolated scanning workers.
8. Add database-backed job queues.
9. Add object storage with private ACLs.
10. Add approval authorization and CSRF protection.
