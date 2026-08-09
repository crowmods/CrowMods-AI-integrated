# Phase 8 Notes

Discord API publishing uses a bot token and channel ID stored server-side.

Before production:
1. Create a Discord application/bot.
2. Install it through Discord's OAuth2 flow.
3. Grant only required channel permissions.
4. Store the token as a secret.
5. Configure the announcement channel.
6. Keep dry-run enabled while testing.
7. Add persistent moderation/audit logs.
8. Add a curated FAQ knowledge base.
9. Add human escalation for uncertain moderation.
10. Respect Discord rate limits and server rules.
