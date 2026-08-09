# Phase 7 Notes

Campaign templates:
- release
- update
- featured

The campaign object supports:
- template
- image URL
- scheduled time
- status

Scheduling is metadata-only in this prototype. Production should use a
durable queue and scheduler (for example a worker + Redis/BullMQ or an
equivalent managed job system).

For generated images, use an approved image-generation pipeline and store
the resulting asset in private/object storage before publishing.

Never use mass-posting, fake accounts, credential automation, or engagement
manipulation. Use official platform APIs and respect rate limits and policies.
