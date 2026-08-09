CREATE TABLE IF NOT EXISTS scheduler_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL UNIQUE,
  cadence TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scheduler_jobs(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNED'
    CHECK(status IN ('PLANNED','RUNNING','PASSED','FAILED','SKIPPED')),
  resilience_score DOUBLE PRECISION,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS capacity_forecasts (
  id BIGSERIAL PRIMARY KEY,
  region_name TEXT NOT NULL,
  horizon_hours INTEGER NOT NULL,
  current_score DOUBLE PRECISION NOT NULL,
  forecast_score DOUBLE PRECISION NOT NULL,
  trend DOUBLE PRECISION NOT NULL,
  risk_level TEXT NOT NULL
    CHECK(risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resilience_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name TEXT,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('INFO','WARNING','HIGH','CRITICAL')),
  message TEXT NOT NULL,
  observed_score DOUBLE PRECISION,
  threshold DOUBLE PRECISION,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_runs_job_time
ON exercise_runs(job_id,started_at DESC);

CREATE INDEX IF NOT EXISTS idx_capacity_forecast_region_time
ON capacity_forecasts(region_name,generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_resilience_alerts_time
ON resilience_alerts(created_at DESC);
