# CrowMods AI — Phase 98: Alert Triage, Privileged Sessions & Signed Evidence

Adds security-operations controls for detecting, triaging, and preserving
high-value authorization events.

Included:
- alert lifecycle and triage
- acknowledgement and closure controls
- privileged-session registration
- session activity monitoring
- suspicious-session scoring
- signed governance evidence abstraction
- KMS-backed signing contract
- evidence verification
- security operations dashboard
- regression tests
- smoke test

Production note:
The included signer is a deterministic development adapter. Production
evidence signing must use managed KMS/HSM keys and immutable evidence storage.
