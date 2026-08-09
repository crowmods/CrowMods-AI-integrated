# CrowMods AI — Phase 11: PostgreSQL Infrastructure

Adds a production-oriented PostgreSQL schema and migration foundation.

Tables:
- users
- releases
- release_ai_briefs
- approvals
- campaigns
- campaign_targets
- publishing_jobs
- audit_events
- analytics_events

This phase does not include production credentials. Configure DATABASE_URL
through a secure environment/secret manager.

The schema is designed to support the AI upload -> approval -> publishing ->
analytics lifecycle.
