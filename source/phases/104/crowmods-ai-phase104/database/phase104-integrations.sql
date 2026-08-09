CREATE TABLE IF NOT EXISTS signing_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  key_id TEXT NOT NULL,
  key_version TEXT,
  algorithm TEXT NOT NULL,
  digest TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('SIGNED','FAILED','BLOCKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS siem_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  destination TEXT NOT NULL,
  authentication_mode TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('DELIVERED','FAILED','RETRYING','BLOCKED')),
  attempt INTEGER NOT NULL DEFAULT 1,
  response_code INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificate_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target TEXT NOT NULL,
  chain_status TEXT NOT NULL
    CHECK(chain_status IN ('VALID','INVALID','BLOCKED')),
  issuer TEXT,
  subject TEXT,
  expires_at TIMESTAMPTZ,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signing_operations_time
ON signing_operations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_siem_deliveries_time
ON siem_deliveries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_certificate_validations_time
ON certificate_validations(created_at DESC);
