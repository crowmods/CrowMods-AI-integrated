INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
  AND p.key IN ('dashboard.read','release.read','release.create','release.update','release.approve','release.reject','release.publish','upload.read','upload.create','customer.read','analytics.read','settings.read','settings.update','audit.read','integration.manage','notification.read','job.read','plan.read')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'OPERATOR'
  AND p.key IN ('dashboard.read','release.read','release.create','release.update','upload.read','upload.create','notification.read','job.read')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'SUPPORT'
  AND p.key IN ('dashboard.read','release.read','customer.read','customer.update','notification.read','plan.read')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'VIEWER'
  AND p.key IN ('dashboard.read','release.read','notification.read')
ON CONFLICT DO NOTHING;