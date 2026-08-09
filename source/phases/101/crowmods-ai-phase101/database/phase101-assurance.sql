CREATE TABLE IF NOT EXISTS security_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_key TEXT NOT NULL UNIQUE,
  control_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  criticality TEXT NOT NULL
    CHECK(criticality IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  expected_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assurance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID REFERENCES security_controls(id) ON DELETE CASCADE,
  observed_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL
    CHECK(status IN ('PASS','DRIFT','FAIL','BLOCKED')),
  evidence_hash TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS remediation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID REFERENCES security_controls(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','IN_PROGRESS','RESOLVED','ACCEPTED_RISK')),
  owner TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assurance_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_version TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('PASS','DRIFT','FAIL','BLOCKED')),
  passed INTEGER NOT NULL DEFAULT 0,
  drifted INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assurance_checks_time
ON assurance_checks(checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_remediation_status
ON remediation_items(status,severity,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assurance_runs_time
ON assurance_runs(created_at DESC);
