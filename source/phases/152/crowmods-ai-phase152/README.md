# CrowMods AI — Phase 152
## Distributed Sliding-Window Rate Limiting

Implements a shared sliding-window rate limiter using PostgreSQL row-level
locking and transactional updates. The design is suitable for multiple API
instances sharing one database.

No credentials or secrets are included.
