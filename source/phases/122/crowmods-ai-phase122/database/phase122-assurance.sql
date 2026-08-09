CREATE TABLE IF NOT EXISTS serializable_fencing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key TEXT NOT NULL,
  observed_version BIGINT NOT NULL,
  committed_version BIGINT,
  result TEXT NOT NULL CHECK(result IN ('COMMITTED','ABORTED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adaptive_canary_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rollout_key TEXT NOT NULL,
  current_traffic NUMERIC(6,3) NOT NULL,
  next_traffic NUMERIC(6,3) NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('ADVANCE','HOLD','ROLLBACK','PROMOTE')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delegation_lease_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  lease_token TEXT NOT NULL,
  previous_expiry TIMESTAMPTZ NOT NULL,
  new_expiry TIMESTAMPTZ NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('RENEWED','REJECTED','EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conformal_calibration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_count INTEGER NOT NULL,
  coverage_target NUMERIC(7,4) NOT NULL,
  nonconformity_quantile NUMERIC(12,5),
  empirical_coverage NUMERIC(7,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forecast_drift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_error NUMERIC(12,5) NOT NULL,
  recent_error NUMERIC(12,5) NOT NULL,
  drift_ratio NUMERIC(12,5) NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('STABLE','WATCH','DRIFT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kms_provider_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('SIGN','VERIFY')),
  integration_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('SUCCESS','FAILED','BLOCKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_serializable_fencing_time
ON serializable_fencing_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_adaptive_canary_time
ON adaptive_canary_decisions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lease_heartbeats_time
ON delegation_lease_heartbeats(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conformal_calibration_time
ON conformal_calibration_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forecast_drift_time
ON forecast_drift_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kms_provider_time
ON kms_provider_events(created_at DESC);
