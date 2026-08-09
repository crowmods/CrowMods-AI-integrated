# Phase 6 Notes

Telegram uses the official Bot API.

Dry-run is enabled by default so the project can be tested without publishing.
Set TELEGRAM_DRY_RUN=false only after:
1. the bot is created;
2. the bot is granted appropriate channel permissions;
3. TELEGRAM_BOT_TOKEN is stored as a server-side secret;
4. TELEGRAM_CHANNEL_ID is configured;
5. the website URL is correct;
6. the release is authorized and approved.

The next iteration can add generated promotional images using an approved
image-generation workflow and then use sendPhoto with a caption/button.
