# Phase 37 Notes

## Development/staging

Docker Compose provides:
- PostgreSQL
- Redis
- backend
- frontend
- Nginx

## Production

Recommended architecture:

Internet
-> CDN/WAF
-> TLS reverse proxy/load balancer
-> frontend/backend
-> private network
-> managed PostgreSQL
-> managed Redis
-> private object storage

Supporting services:
- secrets manager
- centralized logs
- metrics
- error tracking
- backup storage
- CI/CD

## Deployment sequence

1. Build immutable images.
2. Run CI tests/builds.
3. Scan dependencies and images.
4. Deploy to staging.
5. Run health checks and smoke tests.
6. Apply database migrations.
7. Deploy production.
8. Verify readiness/metrics.
9. Keep previous release available for rollback.

## Security

Never commit:
- production passwords;
- API keys;
- Telegram/Discord tokens;
- OAuth client secrets;
- payment-provider secrets;
- private signing keys.

Use environment injection or a dedicated secrets manager.

## Backup

Backups should be:
- encrypted;
- access-controlled;
- retained according to policy;
- tested by restoration drills;
- stored separately from the primary database.

## Important

The included Compose stack is a starting point, not a claim that the system
is production-secure by itself. Before public launch, perform a real security
review, dependency/image scanning, load testing, backup restore test and
platform/API compliance review.
