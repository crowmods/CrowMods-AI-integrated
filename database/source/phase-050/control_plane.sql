CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_user_ref TEXT NOT NULL UNIQUE,
  role_id UUID REFERENCES admin_roles(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('ACTIVE','SUSPENDED','REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_events (
  id BIGSERIAL PRIMARY KEY,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK(status IN ('QUEUED','RUNNING','WAITING_REVIEW','COMPLETED','FAILED','CANCELLED')),
  priority TEXT NOT NULL DEFAULT 'NORMAL'
    CHECK(priority IN ('LOW','NORMAL','HIGH','URGENT')),
  input_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

INSERT INTO admin_roles(name,description)
VALUES
  ('OWNER','Full control'),
  ('ADMIN','Operational administration'),
  ('EDITOR','Content and release management'),
  ('SUPPORT','Customer support'),
  ('ANALYST','Analytics read access')
ON CONFLICT(name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_admin_audit_time
ON admin_audit_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_queue
ON ai_tasks(status,priority,created_at);
