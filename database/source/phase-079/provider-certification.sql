CREATE TABLE IF NOT EXISTS provider_adapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'development',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_health_checks (
  id BIGSERIAL PRIMARY KEY,
  adapter_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  healthy BOOLEAN NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_name TEXT NOT NULL,
  environment TEXT NOT NULL,
  kms_ready BOOLEAN NOT NULL,
  worm_ready BOOLEAN NOT NULL,
  retention_ready BOOLEAN NOT NULL,
  health_checks_passed BOOLEAN NOT NULL,
  certified BOOLEAN NOT NULL,
  certified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dr_validation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_name TEXT NOT NULL,
  backup_verified BOOLEAN NOT NULL DEFAULT FALSE,
  restore_verified BOOLEAN NOT NULL DEFAULT FALSE,
  integrity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  provider_reconnect_verified BOOLEAN NOT NULL DEFAULT FALSE,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_health_time
ON provider_health_checks(adapter_type,checked_at DESC);
