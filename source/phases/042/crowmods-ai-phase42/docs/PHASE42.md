# Phase 42 Notes

Campaign flow:

approved release page
-> campaign brief
-> platform-specific drafts
-> approved media selection
-> human review
-> scheduling
-> official connector
-> publication
-> platform result
-> analytics

## Platform connectors

Each connector should be isolated behind an adapter interface:

createPost()
schedulePost()
getStatus()
cancelPost()

Use official APIs/OAuth and follow each platform's automation, rate-limit,
content and advertising policies.

## Scheduling

Production scheduler should:
- respect platform time zones;
- enforce rate limits;
- retry transient failures;
- use idempotency keys;
- avoid duplicate posts;
- pause when a connector is unhealthy;
- record external post IDs.

## Anti-spam design

Crow AI should not automatically post repetitive content at high frequency.
Use:
- campaign caps;
- per-platform frequency limits;
- duplicate-content detection;
- human approval for new campaigns;
- opt-out controls;
- platform-specific policies.

## Monetization

Campaign analytics can later connect to:
- website sessions;
- download conversions;
- premium signups;
- affiliate conversions;
- sponsorship attribution.

Only use promotional content for products/content you are authorized to
promote and distribute.
