# ₹0-first deployment strategy

Use the free tier of a managed PostgreSQL provider where available, while
keeping the application portable to another PostgreSQL provider later.

Avoid coupling application code to proprietary database features.

Store large APK binaries in object storage, not PostgreSQL.

At scale, separate:
- web/API
- database
- object storage
- worker/queue
- analytics

Upgrade each component independently as revenue arrives.
