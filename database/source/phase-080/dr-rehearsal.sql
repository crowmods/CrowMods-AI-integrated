CREATE TABLE IF NOT EXISTS dr_rehearsals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rehearsal_name TEXT NOT NULL,
  source_region TEXT NOT NULL,
  target_region TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PLANNED'
    CHECK(status IN ('PLANNED','RUNNING','PASSED','FAILED')),
  rto_seconds DOUBLE PRECISION,
  rpo_seconds DOUBLE PRECISION,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS dr_rehearsal_checks (
  id BIGSERIAL PRIMARY KEY,
  rehearsal_id UUID NOT NULL REFERENCES dr_rehearsals(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  observed_value TEXT,
  expected_value TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dr_recovery_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  rto_target_seconds INTEGER NOT NULL,
  rpo_target_seconds INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dr_rehearsals_time
ON dr_rehearsals(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_dr_checks_rehearsal
ON dr_rehearsal_checks(rehearsal_id,checked_at DESC);
