# CrowMods AI — Phase 17: Background Job Queue

Adds a provider-neutral asynchronous job model.

Job types:
- APK_PROCESS
- SECURITY_SCAN
- AI_CONTENT
- WEBSITE_PUBLISH
- TELEGRAM_PUBLISH
- DISCORD_PUBLISH
- SOCIAL_CAMPAIGN
- ANALYTICS_AGGREGATION

The database queue provides:
- queued/running/succeeded/failed/cancelled states
- retry count
- scheduled availability
- worker locking
- error capture

Production workers should claim jobs transactionally using PostgreSQL
FOR UPDATE SKIP LOCKED, execute only their allowed task type, and acknowledge
completion/failure. Never execute uploaded APKs.
