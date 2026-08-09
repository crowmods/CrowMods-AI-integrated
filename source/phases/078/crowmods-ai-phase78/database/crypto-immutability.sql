CREATE TABLE IF NOT EXISTS signing_keys (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL,
  key_version INTEGER NOT NULL,
  algorithm TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('ACTIVE','ROTATING','RETIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_at TIMESTAMPTZ,
  UNIQUE(key_name,key_version)
);

CREATE TABLE IF NOT EXISTS evidence_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL,
  key_id UUID NOT NULL,
  algorithm TEXT NOT NULL,
  key_version INTEGER NOT NULL,
  signature TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS immutable_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID,
  object_key TEXT NOT NULL,
  content_sha256 TEXT NOT NULL,
  retention_until TIMESTAMPTZ,
  storage_class TEXT NOT NULL DEFAULT 'APPEND_ONLY',
  exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  immutable BOOLEAN NOT NULL DEFAULT TRUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_signatures_evidence
ON evidence_signatures(evidence_id,signed_at DESC);

CREATE INDEX IF NOT EXISTS idx_immutable_exports_incident
ON immutable_exports(incident_id,exported_at DESC);
