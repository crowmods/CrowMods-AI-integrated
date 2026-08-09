# Phase 25 Notes

Discord flow:

approved release
-> AI embed
-> artwork
-> human approval
-> queue
-> official Discord API
-> message ID
-> analytics

Useful embed elements:
- title
- description
- version
- verified features
- release URL
- approved image
- footer/branding

Use only servers/channels where the CrowMods bot has explicit authorization.

Avoid:
- unsolicited DMs;
- mass mentions;
- fake members/reactions;
- automated spam;
- bypassing rate limits;
- storing bot credentials in source code.

For platform-specific limits, validate payload size and rate-limit behavior in
the connector rather than assuming generic limits.
