# CrowMods AI — Phase 5: Website Publisher

Adds a prototype publishing gate for approved releases.

Flow:
APPROVED -> PUBLISHING -> PUBLISHED

The prototype creates a public release manifest and a public listing page
record. APK files remain outside the public web root in quarantine until
a production object-storage publisher is configured.

Only publish files you are authorized to redistribute.
