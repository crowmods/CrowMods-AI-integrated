# Phase 55 Runbook

## Deployment topology

Internet
-> TLS reverse proxy
-> Frontend/API
-> private network
-> PostgreSQL + Redis

Workers remain private and are never exposed as public HTTP services.

## Production checklist

### Before deployment
- [ ] Domain/DNS configured
- [ ] TLS certificate configured
- [ ] Secrets loaded from a secrets manager
- [ ] Database backup completed
- [ ] Restore test completed
- [ ] Firewall rules reviewed
- [ ] PostgreSQL/Redis not publicly exposed
- [ ] MFA enabled for administrators
- [ ] Monitoring and alerting enabled
- [ ] Rollback procedure tested

### Deployment
1. Build immutable images.
2. Run database migrations in a controlled step.
3. Start API/worker.
4. Start frontend.
5. Verify readiness.
6. Verify critical application flows.
7. Gradually direct traffic.
8. Monitor error rate and latency.

### Rollback
- Stop/scale down the new release.
- Restore the previous application image.
- Verify schema compatibility.
- Roll back database changes only with a tested migration strategy.
- Re-run health checks.

Never blindly restore a production database during an application rollback.

## Backups

Use:
- automated managed PostgreSQL backups;
- point-in-time recovery where available;
- encrypted backup storage;
- retention policy;
- off-site/region-separated copies where appropriate.

A backup is not considered reliable until a restore has been tested.

## Disaster recovery

Define:
- RPO — acceptable data-loss window;
- RTO — acceptable recovery-time window;
- primary region;
- recovery environment;
- backup owner;
- incident commander;
- communication procedure.

Practice recovery periodically.

## Zero-cost staging

The compose stack can be run locally or on a private staging machine.
The mock AI provider allows application-flow testing without AI inference
charges.

Production hosting, storage, domains, TLS, AI inference and external API
usage may incur costs.

## Security

Do not expose:
- PostgreSQL;
- Redis;
- worker ports;
- internal admin APIs

directly to the public internet.

Use private networks and firewall rules.

## Next

Build end-to-end staging verification, database migration automation,
managed-queue adapter, real AI provider adapters, TLS automation, deployment
CI/CD and release rollback automation.
