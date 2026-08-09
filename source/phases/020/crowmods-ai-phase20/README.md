# CrowMods AI — Phase 20: Automated APK Intake & Security Pipeline

Adds a safe intake architecture for authorized APK uploads.

Pipeline:
upload -> quarantine -> hash -> metadata -> security-scan job -> AI-content job
-> human approval

Important:
- Uploaded APKs are treated as untrusted files.
- The web/API process never executes an APK.
- The intake service does not claim that a file is malware-free.
- Production scanning must run in an isolated worker/container/VM with
  resource limits and restricted network access.
- Distribution rights and publisher authorization must be verified by the
  operator before publication.
