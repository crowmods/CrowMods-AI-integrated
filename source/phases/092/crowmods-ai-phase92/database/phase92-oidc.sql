CREATE TABLE IF NOT EXISTS oidc_verification_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  issuer TEXT NOT NULL,
  audience TEXT NOT NULL,
  allowed_algorithms JSONB NOT NULL DEFAULT '["RS256"]'::jsonb,
  jwks_uri TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oidc_verification_events (
  id BIGSERIAL PRIMARY KEY,
  provider_name TEXT,
  subject TEXT,
  kid TEXT,
  algorithm TEXT,
  valid BOOLEAN NOT NULL,
  reason TEXT,
  refreshed_jwks BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS key_rollover_events (
  id BIGSERIAL PRIMARY KEY,
  provider_name TEXT NOT NULL,
  old_kids JSONB NOT NULL DEFAULT '[]'::jsonb,
  new_kids JSONB NOT NULL DEFAULT '[]'::jsonb,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oidc_verify_events_time
ON oidc_verification_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_key_rollover_time
ON key_rollover_events(created_at DESC);
