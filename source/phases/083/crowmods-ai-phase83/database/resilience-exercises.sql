CREATE TABLE IF NOT EXISTS exercise_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_name TEXT NOT NULL,
  cadence TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'simulation',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chaos_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercise_schedules(id) ON DELETE SET NULL,
  experiment_name TEXT NOT NULL,
  fault_type TEXT NOT NULL,
  target_scope TEXT NOT NULL,
  dry_run BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'PLANNED'
    CHECK(status IN ('PLANNED','RUNNING','PASSED','FAILED','ROLLED_BACK')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS capacity_scores (
  id BIGSERIAL PRIMARY KEY,
  region_name TEXT NOT NULL,
  availability DOUBLE PRECISION NOT NULL,
  utilization DOUBLE PRECISION NOT NULL,
  replication_lag DOUBLE PRECISION NOT NULL,
  recovery_readiness DOUBLE PRECISION NOT NULL,
  score DOUBLE PRECISION NOT NULL,
  healthy BOOLEAN NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resilience_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID,
  recovery_score DOUBLE PRECISION NOT NULL,
  capacity_score DOUBLE PRECISION NOT NULL,
  chaos_score DOUBLE PRECISION NOT NULL,
  overall_score DOUBLE PRECISION NOT NULL,
  grade TEXT NOT NULL,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_schedule_next
ON exercise_schedules(next_run_at);

CREATE INDEX IF NOT EXISTS idx_capacity_scores_region_time
ON capacity_scores(region_name,observed_at DESC);
