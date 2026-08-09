# CrowMods AI — Phase 6: Telegram Publisher

Adds a Telegram publishing adapter for approved/published releases.

Features:
- professional HTML-formatted post generation
- optional image URL
- inline website/download button
- Telegram Bot API adapter
- dry-run mode when credentials are not configured
- publishing status and audit fields

Configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID only through secure
server-side environment variables.

Use Telegram's official Bot API and comply with channel/platform rules.
Only publish authorized content.
