CREATE TABLE IF NOT EXISTS live_probe_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_type TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('PASS','WARN','FAIL','BLOCKED')),
  latency_ms INTEGER,
  evidence_hash TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS remediation_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_key TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  risk_level TEXT NOT NULL
    CHECK(risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL DEFAULT 'PROPOSED'
    CHECK(status IN ('PROPOSED','APPROVED','REJECTED','EXECUTED','FAILED')),
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_evidence_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_run_id UUID REFERENCES live_probe_runs(id) ON DELETE CASCADE,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  key_version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_probe_runs_time
ON live_probe_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_remediation_plans_status
ON remediation_plans(status,risk_level,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_evidence_probe
ON health_evidence_signatures(probe_run_id,created_at DESC);
