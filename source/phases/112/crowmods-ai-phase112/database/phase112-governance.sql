CREATE TABLE IF NOT EXISTS evidence_verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_type TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  verification_status TEXT NOT NULL
    CHECK(verification_status IN ('VERIFIED','FAILED','BLOCKED')),
  verifier_key_version TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_test_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID REFERENCES security_controls(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL
    CHECK(frequency IN ('DAILY','WEEKLY','MONTHLY','QUARTERLY')),
  next_run_at TIMESTAMPTZ NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  owner TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_effectiveness_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID REFERENCES security_controls(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL,
  effectiveness_percent NUMERIC(7,3) NOT NULL,
  trend TEXT NOT NULL
    CHECK(trend IN ('IMPROVING','STABLE','DECLINING','INSUFFICIENT_DATA'))
);

CREATE TABLE IF NOT EXISTS governance_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_key TEXT NOT NULL UNIQUE,
  framework_name TEXT NOT NULL,
  version TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS governance_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID REFERENCES governance_frameworks(id) ON DELETE CASCADE,
  control_id UUID REFERENCES security_controls(id) ON DELETE CASCADE,
  requirement_key TEXT NOT NULL,
  requirement_name TEXT NOT NULL,
  mapping_status TEXT NOT NULL
    CHECK(mapping_status IN ('MAPPED','PARTIAL','UNMAPPED')),
  evidence_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_verification_time
ON evidence_verification_events(verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_control_trends_time
ON control_effectiveness_trends(measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_governance_mappings_status
ON governance_mappings(mapping_status);
