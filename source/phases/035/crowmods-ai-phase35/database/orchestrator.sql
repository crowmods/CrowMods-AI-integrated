CREATE TABLE IF NOT EXISTS workflow_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','PROCESSING','COMPLETED','FAILED','DEAD_LETTER')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RUNNING'
    CHECK(status IN ('RUNNING','WAITING_APPROVAL','COMPLETED','FAILED','CANCELLED')),
  current_step TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS workflow_audit (
  id BIGSERIAL PRIMARY KEY,
  workflow_run_id UUID REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_events_queue
ON workflow_events(status,available_at,created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_status
ON workflow_runs(status,created_at DESC);
