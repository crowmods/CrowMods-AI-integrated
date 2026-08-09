# Security Evidence Manifest

The final release should retain evidence for:

1. JWT verification tests
2. JWKS rollover tests
3. RBAC policy tests
4. Role hierarchy tests
5. Scoped-permission tests
6. Policy simulation tests
7. Policy version/rollback tests
8. Dual-approval tests
9. Access-review tests
10. Stale-access detection tests
11. Anomaly-detection tests
12. Policy-conflict tests
13. Alert-triage tests
14. Privileged-session tests
15. SIEM normalization tests
16. Escalation tests
17. Session-response tests
18. Evidence integrity tests
19. Signed-evidence export tests
20. Final release-validation output

Each production release should additionally retain:

- deployment identifier;
- source revision;
- artifact SHA-256 hashes;
- validation timestamp;
- environment identifier;
- reviewer/approver records;
- KMS key version;
- SIEM destination identifier;
- release decision.

Do not include secrets, private keys, bearer tokens, or sensitive personal data
in the evidence bundle.
