CREATE TABLE IF NOT EXISTS authorization_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  required_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  effect TEXT NOT NULL DEFAULT 'ALLOW'
    CHECK(effect IN ('ALLOW','DENY')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS authorization_decisions (
  id BIGSERIAL PRIMARY KEY,
  subject TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  policy_id UUID,
  allowed BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_policy_lookup
ON authorization_policies(resource,action,enabled,priority);

CREATE INDEX IF NOT EXISTS idx_auth_decisions_time
ON authorization_decisions(created_at DESC);
