# CrowMods AI — Phase 37: Production Deployment & Infrastructure

Adds a deployment-ready infrastructure foundation.

Included:
- Docker Compose development/staging stack
- PostgreSQL
- Redis
- backend/frontend service boundaries
- Nginx reverse proxy
- health checks
- persistent volumes
- environment templates
- CI workflow skeleton
- backup/restore scripts
- production deployment checklist

Secrets are deliberately excluded. Replace all example credentials before use.
For production, use managed infrastructure, a secrets manager, TLS certificates,
WAF/CDN, private networking and a managed PostgreSQL/Redis service where practical.
