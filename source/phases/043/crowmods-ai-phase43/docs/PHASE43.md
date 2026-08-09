# Phase 43 Notes

## Connector architecture

Campaign
-> connector job
-> provider adapter
-> official API
-> external post
-> status sync
-> analytics

Every connector should implement a small contract:
- connect;
- health;
- publish;
- schedule where supported;
- status;
- revoke.

## Authentication

Use:
- OAuth where the platform provides it;
- short-lived access tokens where possible;
- encrypted refresh-token storage;
- a dedicated secrets manager;
- minimum required scopes;
- token rotation/revocation.

Never:
- store provider tokens in frontend JavaScript;
- commit secrets to Git;
- ask users for passwords to third-party platforms;
- use credential scraping.

## Reliability

Jobs use:
- idempotency keys;
- bounded retries;
- external post references;
- failure states;
- event records.

Production workers should use a durable queue and provider-aware backoff.

## Platform compliance

Each platform has different API access, automation, content, rate-limit and
review requirements. The connector must stop publishing when authorization is
revoked or a provider reports policy/rate-limit errors.

Do not build the system to evade bans, rate limits, moderation or platform
security controls. If a platform blocks a workflow, use its documented appeal,
API or integration path instead.
