# Phase 38 Notes

## Secure upload flow

1. Authenticated uploader starts upload.
2. File goes to private quarantine storage.
3. Validate size, extension and content type.
4. Compute SHA-256.
5. Record immutable upload metadata.
6. Send to an isolated scanning adapter.
7. Reject/quarantine infected or errored files.
8. Human approval is required.
9. Move/copy approved file into private release storage.
10. Generate short-lived signed download URLs.

## Important security rules

- Never execute an uploaded APK on the web/application server.
- Never make quarantine objects public.
- Use generated object keys rather than user filenames as storage paths.
- Stream large files instead of buffering them in memory.
- Enforce upload size limits at CDN/WAF, reverse proxy and application layers.
- Validate the actual file structure in the scanning layer.
- Store hashes for integrity/deduplication.
- Keep scan and approval state auditable.

## Production storage

Use private object storage such as an authorized S3-compatible provider.
The application should issue short-lived signed URLs rather than exposing
bucket credentials or storage paths.

## Scanner adapter

The scanner boundary can later connect to an approved malware-analysis or
antivirus service. The application should treat scanner results as untrusted
input and require deterministic policy checks.

## Distribution/legal gate

Before publishing any APK/mod, verify that you have the right to distribute
it. The automation should reject content that violates applicable laws,
copyright/licensing terms, or platform/provider policies.

The system should not be designed to distribute malicious software, cracked
paid applications, stolen content, or files intended to compromise devices.
