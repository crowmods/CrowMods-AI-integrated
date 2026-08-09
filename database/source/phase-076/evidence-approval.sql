CREATE TABLE IF NOT EXISTS provider_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recovery_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL,
  evidence_type TEXT NOT NULL,
  source TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS postmortem_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL UNIQUE,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  package_status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(package_status IN ('DRAFT','READY','APPROVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS closure_approvals (
  id BIGSERIAL PRIMARY KEY,
  incident_id UUID NOT NULL,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recovery_evidence_incident
ON recovery_evidence(incident_id,collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_closure_approvals_incident
ON closure_approvals(incident_id,created_at DESC);
