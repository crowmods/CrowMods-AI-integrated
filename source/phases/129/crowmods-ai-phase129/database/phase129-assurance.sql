CREATE TABLE IF NOT EXISTS breaker_cooldown_jobs (
  breaker_key TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK(state IN ('OPEN','HALF_OPEN','CLOSED')),
  lease_token TEXT,
  fencing_version BIGINT NOT NULL DEFAULT 0,
  cooldown_until TIMESTAMPTZ,
  next_check_at TIMESTAMPTZ,
  worker_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recovery_scheduler_leases (
  rollout_key TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL,
  lease_token TEXT NOT NULL,
  fencing_version BIGINT NOT NULL DEFAULT 0,
  lease_expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS takeover_retry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('RETRY','TAKEN_OVER','CONFLICT','ABORTED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS confidence_calibration_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  coverage NUMERIC(8,5),
  lower_bound NUMERIC(8,5),
  upper_bound NUMERIC(8,5),
  target_coverage NUMERIC(8,5) NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('EXPAND','SHRINK','HOLD','INSUFFICIENT_DATA')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_review_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer TEXT NOT NULL,
  fingerprint TEXT,
  action_filter TEXT,
  from_time TIMESTAMPTZ,
  to_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breaker_cooldown_check
ON breaker_cooldown_jobs(next_check_at);

CREATE INDEX IF NOT EXISTS idx_recovery_scheduler_lease
ON recovery_scheduler_leases(lease_expires_at);

CREATE INDEX IF NOT EXISTS idx_takeover_retry_time
ON takeover_retry_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calibration_action_time
ON confidence_calibration_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_review_query_time
ON alert_review_queries(created_at DESC);
