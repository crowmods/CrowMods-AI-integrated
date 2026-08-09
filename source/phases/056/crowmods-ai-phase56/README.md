# CrowMods AI — Phase 56: CI/CD, Automated Testing & Staging

Adds a deployment pipeline foundation.

Flow:
Git push -> CI -> lint -> unit tests -> integration tests -> security checks
-> Docker build -> staging -> smoke tests -> approval -> production -> health
verification -> rollback on failed deployment.

Included:
- GitHub Actions CI
- backend tests
- frontend build check
- dependency audit
- Docker image build
- staging compose profile
- smoke-test script
- migration gate
- production approval gate
- deployment health verification
- rollback helper
- release checklist

Secrets must be configured in GitHub Actions or an external deployment
platform's secret store. Never commit credentials or production .env files.
