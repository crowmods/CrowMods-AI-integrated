CREATE TABLE IF NOT EXISTS rbac_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  parent_role TEXT,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rbac_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rbac_role_scopes (
  role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  scope_id UUID NOT NULL REFERENCES rbac_scopes(id) ON DELETE CASCADE,
  PRIMARY KEY(role_id,scope_id)
);

CREATE TABLE IF NOT EXISTS policy_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID,
  requested_by TEXT NOT NULL,
  change_type TEXT NOT NULL,
  proposed_change JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','APPROVED','REJECTED','APPLIED')),
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS rbac_change_audit (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT NOT NULL,
  operation TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  before_state JSONB,
  after_state JSONB,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rbac_roles_parent
ON rbac_roles(parent_role);

CREATE INDEX IF NOT EXISTS idx_rbac_change_requests_status
ON policy_change_requests(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rbac_change_audit_time
ON rbac_change_audit(created_at DESC);
