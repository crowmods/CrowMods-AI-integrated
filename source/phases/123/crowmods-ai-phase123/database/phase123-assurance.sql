CREATE TABLE IF NOT EXISTS fencing_cas_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key TEXT NOT NULL,
  expected_version BIGINT NOT NULL,
  committed_version BIGINT,
  result TEXT NOT NULL CHECK(result IN ('COMMITTED','ABORTED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canary_hysteresis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rollout_key TEXT NOT NULL,
  health_score NUMERIC(8,4) NOT NULL,
  consecutive_failures INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('ADVANCE','HOLD','ROLLBACK','RECOVER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lease_fence_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  lease_token TEXT NOT NULL,
  fencing_version BIGINT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('RENEWED','REJECTED','EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS online_calibration_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_size INTEGER NOT NULL,
  coverage_target NUMERIC(7,4) NOT NULL,
  interval_radius NUMERIC(12,5),
  empirical_coverage NUMERIC(7,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forecast_drift_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_ratio NUMERIC(12,5) NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('INFO','WARNING','CRITICAL')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fencing_cas_time
ON fencing_cas_operations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_canary_hysteresis_time
ON canary_hysteresis_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lease_fence_time
ON lease_fence_renewals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_online_calibration_time
ON online_calibration_windows(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drift_alerts_time
ON forecast_drift_alerts(created_at DESC);
