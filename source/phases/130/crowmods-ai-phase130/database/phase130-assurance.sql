CREATE TABLE IF NOT EXISTS worker_lease_failover (
  worker_key TEXT PRIMARY KEY,
  active_worker_id TEXT,
  lease_token TEXT,
  fencing_version BIGINT NOT NULL DEFAULT 0,
  lease_expires_at TIMESTAMPTZ,
  last_renewed_at TIMESTAMPTZ,
  state TEXT NOT NULL CHECK(state IN ('ACTIVE','EXPIRED','FAILED_OVER')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduler_renewal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_key TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  lease_token TEXT NOT NULL,
  expected_fencing_version BIGINT NOT NULL,
  committed_fencing_version BIGINT,
  result TEXT NOT NULL CHECK(result IN ('RENEWED','CONFLICT','EXPIRED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS takeover_retry_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  delay_ms INTEGER NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('RETRY','TAKEN_OVER','CONFLICT','ABORTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sequential_calibration_controller (
  model_key TEXT PRIMARY KEY,
  sample_count BIGINT NOT NULL DEFAULT 0,
  covered_count BIGINT NOT NULL DEFAULT 0,
  target_coverage NUMERIC(8,5) NOT NULL,
  lower_bound NUMERIC(8,5),
  upper_bound NUMERIC(8,5),
  action TEXT NOT NULL CHECK(action IN ('EXPAND','SHRINK','HOLD','INSUFFICIENT_DATA')),
  window_size INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_review_access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer TEXT NOT NULL,
  role_name TEXT NOT NULL,
  fingerprint TEXT,
  action_filter TEXT,
  page INTEGER NOT NULL,
  page_size INTEGER NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('ALLOWED','DENIED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_failover_expiry
ON worker_lease_failover(lease_expires_at);

CREATE INDEX IF NOT EXISTS idx_scheduler_renewal_time
ON scheduler_renewal_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_takeover_retry_telemetry
ON takeover_retry_telemetry(run_key,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sequential_calibration_action
ON sequential_calibration_controller(action,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_review_access_time
ON alert_review_access_events(created_at DESC);
