CREATE TABLE IF NOT EXISTS gamedays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'simulation',
  status TEXT NOT NULL DEFAULT 'PLANNED'
    CHECK(status IN ('PLANNED','RUNNING','PASSED','FAILED','ROLLED_BACK')),
  dry_run BOOLEAN NOT NULL DEFAULT TRUE,
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS gameday_steps (
  id BIGSERIAL PRIMARY KEY,
  gameday_id UUID NOT NULL REFERENCES gamedays(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','RUNNING','PASSED','FAILED','ROLLED_BACK')),
  checkpoint TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gameday_approvals (
  id BIGSERIAL PRIMARY KEY,
  gameday_id UUID NOT NULL REFERENCES gamedays(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gameday_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gameday_id UUID NOT NULL REFERENCES gamedays(id) ON DELETE CASCADE,
  passed_steps INTEGER NOT NULL DEFAULT 0,
  failed_steps INTEGER NOT NULL DEFAULT 0,
  rollback_count INTEGER NOT NULL DEFAULT 0,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gameday_steps_order
ON gameday_steps(gameday_id,step_order);
