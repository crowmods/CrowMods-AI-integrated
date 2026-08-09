# CrowMods AI — Phase 24: Telegram Automation Engine

Adds a Telegram publishing control-plane foundation.

Features:
- channel configuration records
- post drafts
- approval status
- publishing jobs
- scheduling
- Telegram message template model
- inline-button metadata
- publish result tracking
- retry/failure handling

The actual Telegram Bot API connector is intentionally isolated behind an
adapter. Use a bot/account you control and comply with Telegram rules and
channel policies. Never automate spam, fake engagement, or unsolicited
messaging.
