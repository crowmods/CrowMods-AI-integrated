INSERT INTO roles (id, name, description) VALUES
  (gen_random_uuid(), 'SUPER_ADMIN', 'Full control over the platform'),
  (gen_random_uuid(), 'ADMIN', 'Administrative control over releases and publishing'),
  (gen_random_uuid(), 'OPERATOR', 'Create and manage uploads and releases'),
  (gen_random_uuid(), 'SUPPORT', 'View and assist customers'),
  (gen_random_uuid(), 'VIEWER', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, key, description) VALUES
  (gen_random_uuid(), 'dashboard.read', 'View dashboard'),
  (gen_random_uuid(), 'release.read', 'View releases'),
  (gen_random_uuid(), 'release.create', 'Create releases'),
  (gen_random_uuid(), 'release.update', 'Update releases'),
  (gen_random_uuid(), 'release.approve', 'Approve releases'),
  (gen_random_uuid(), 'release.reject', 'Reject releases'),
  (gen_random_uuid(), 'release.publish', 'Publish releases'),
  (gen_random_uuid(), 'upload.read', 'View uploads'),
  (gen_random_uuid(), 'upload.create', 'Create uploads'),
  (gen_random_uuid(), 'upload.delete', 'Delete uploads'),
  (gen_random_uuid(), 'customer.read', 'View customers'),
  (gen_random_uuid(), 'customer.update', 'Update customers'),
  (gen_random_uuid(), 'analytics.read', 'View analytics'),
  (gen_random_uuid(), 'settings.read', 'View settings'),
  (gen_random_uuid(), 'settings.update', 'Update settings'),
  (gen_random_uuid(), 'audit.read', 'View audit logs'),
  (gen_random_uuid(), 'integration.manage', 'Manage integrations'),
  (gen_random_uuid(), 'user.manage', 'Manage users'),
  (gen_random_uuid(), 'notification.read', 'View notifications'),
  (gen_random_uuid(), 'job.read', 'View jobs'),
  (gen_random_uuid(), 'plan.read', 'View plans')
ON CONFLICT (key) DO NOTHING;

INSERT INTO plans (id, code, name, limits) VALUES
  (gen_random_uuid(), 'FREE', 'Free', '{"maxUploads":5,"maxReleases":3,"maxStorage":1073741824,"maxPublishingTargets":0,"maxJobs":10,"maxUsers":1}'),
  (gen_random_uuid(), 'STARTER', 'Starter', '{"maxUploads":20,"maxReleases":10,"maxStorage":5368709120,"maxPublishingTargets":1,"maxJobs":50,"maxUsers":1}'),
  (gen_random_uuid(), 'PRO', 'Pro', '{"maxUploads":100,"maxReleases":50,"maxStorage":21474836480,"maxPublishingTargets":2,"maxJobs":200,"maxUsers":3}'),
  (gen_random_uuid(), 'PREMIUM', 'Premium', '{"maxUploads":500,"maxReleases":200,"maxStorage":107374182400,"maxPublishingTargets":3,"maxJobs":1000,"maxUsers":10}'),
  (gen_random_uuid(), 'BUSINESS', 'Business', '{"maxUploads":2000,"maxReleases":1000,"maxStorage":536870912000,"maxPublishingTargets":5,"maxJobs":5000,"maxUsers":25}'),
  (gen_random_uuid(), 'ENTERPRISE', 'Enterprise', '{"maxUploads":100000,"maxReleases":100000,"maxStorage":1099511627776,"maxPublishingTargets":100,"maxJobs":100000,"maxUsers":1000}')
ON CONFLICT (code) DO NOTHING;