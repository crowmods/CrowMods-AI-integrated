CREATE TABLE IF NOT EXISTS ingestion_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL,
  auth_mode TEXT NOT NULL
    CHECK(auth_mode IN ('WORKLOAD_IDENTITY','MTLS','SIGNED_TOKEN','BLOCKED')),
  expected_audience TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signed_report_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  report_version INTEGER NOT NULL,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  key_version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  bundle JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS action_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES post_incident_actions(id) ON DELETE CASCADE,
  escalation_level INTEGER NOT NULL,
  reason TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_key TEXT NOT NULL UNIQUE,
  control_name TEXT NOT NULL,
  category TEXT NOT NULL,
  target_percent NUMERIC(6,3) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_effectiveness_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID REFERENCES security_controls(id) ON DELETE CASCADE,
  total_tests INTEGER NOT NULL,
  passed_tests INTEGER NOT NULL,
  effectiveness_percent NUMERIC(7,3) NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('EFFECTIVE','DEGRADED','INEFFECTIVE','BLOCKED')),
  evidence_ref TEXT,
  tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signed_report_bundles_time
ON signed_report_bundles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_escalations_status
ON action_escalations(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_control_effectiveness_time
ON control_effectiveness_tests(tested_at DESC);
