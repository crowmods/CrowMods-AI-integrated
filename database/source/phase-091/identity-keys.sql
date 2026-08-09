CREATE TABLE IF NOT EXISTS jwks_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  kid TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  key_type TEXT NOT NULL,
  public_key TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  not_before TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id,kid)
);

CREATE TABLE IF NOT EXISTS signing_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_version TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('ACTIVE','ROTATING','RETIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS token_validation_events (
  id BIGSERIAL PRIMARY KEY,
  subject TEXT,
  issuer TEXT,
  audience TEXT,
  kid TEXT,
  valid BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jwks_provider_active
ON jwks_keys(provider_id,active);

CREATE INDEX IF NOT EXISTS idx_token_validation_time
ON token_validation_events(created_at DESC);
