CREATE TABLE IF NOT EXISTS authorization_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  required_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS authorization_events (
  id BIGSERIAL PRIMARY KEY,
  subject TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN NOT NULL,
  roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jwks_transport_events (
  id BIGSERIAL PRIMARY KEY,
  uri TEXT NOT NULL,
  status TEXT NOT NULL,
  cache_control TEXT,
  max_age_seconds INTEGER,
  response_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authorization_events_time
ON authorization_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jwks_transport_events_time
ON jwks_transport_events(created_at DESC);
