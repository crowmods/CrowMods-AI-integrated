CREATE TABLE IF NOT EXISTS identity_role_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer TEXT NOT NULL,
  external_role TEXT NOT NULL,
  internal_role TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(issuer,external_role)
);

CREATE TABLE IF NOT EXISTS oidc_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  issuer TEXT NOT NULL,
  jwks_uri TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_format TEXT NOT NULL,
  storage_provider TEXT NOT NULL,
  object_key TEXT NOT NULL,
  event_count INTEGER NOT NULL,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'EXPORTED'
    CHECK(status IN ('EXPORTED','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_key TEXT NOT NULL UNIQUE,
  event_count INTEGER NOT NULL DEFAULT 1,
  highest_severity TEXT NOT NULL,
  suspicious BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'OPEN',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_mappings_issuer
ON identity_role_mappings(issuer,enabled);

CREATE INDEX IF NOT EXISTS idx_security_correlations_status
ON security_correlations(status,updated_at DESC);
