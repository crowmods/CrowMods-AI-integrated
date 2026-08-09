# CrowMods AI — Phase 7: Telegram Campaign Engine

Adds campaign templates, image-ready Telegram posts, scheduling metadata,
and a safe dry-run publisher.

Production notes:
- Use Telegram's official Bot API.
- Store bot credentials only as server-side secrets.
- Generate or upload promotional artwork only for authorized content.
- Add a real job queue/cron worker before production scheduling.
