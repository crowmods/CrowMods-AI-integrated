# Phase 28 Notes

Community flow:

message
-> normalize
-> FAQ matching
-> moderation signals
-> AI draft
-> human approval
-> authorized connector
-> reply

Escalate:
- potential credential/secrets disclosure;
- financial/account issues;
- unresolved technical incidents;
- legal/takedown requests;
- threats or other high-impact moderation cases.

Do not:
- automatically ban users based only on an AI guess;
- expose private user information;
- send unsolicited DMs;
- create fake moderator identities;
- manipulate community sentiment.

For production, add authentication, role-based access control, audit logs,
rate limits, platform-specific moderation APIs, and a versioned FAQ/knowledge
base.
