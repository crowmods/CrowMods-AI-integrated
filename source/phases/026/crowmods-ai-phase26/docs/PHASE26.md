# Phase 26 Notes

Campaign flow:

approved release
-> AI master content
-> platform-specific variants
-> media variants
-> human approval
-> scheduled queue
-> official platform connectors
-> external post IDs
-> analytics

Platform-specific adapters should handle:
- authentication;
- current API limits;
- payload schemas;
- media requirements;
- retries;
- idempotency;
- error mapping.

Do not build around scraping or browser automation when an official API or
authorized integration exists.

For WhatsApp, Instagram, Facebook and LinkedIn, use the appropriate official
business/developer APIs and verify current eligibility before enabling a
connector.

Campaign AI should optimize clarity and consistency, not manufacture
engagement or impersonate people.
