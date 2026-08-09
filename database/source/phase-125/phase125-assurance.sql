CREATE TABLE IF NOT EXISTS serializable_retry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_key TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  outcome TEXT NOT NULL
    CHECK(outcome IN ('RETRY','COMMITTED','ABORTED')),
  reason TEXT,
  delay_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canary_recovery_stages (
  rollout_key TEXT PRIMARY KEY,
  stage INTEGER NOT NULL DEFAULT 0,
  traffic_percent NUMERIC(6,3) NOT NULL DEFAULT 0,
  consecutive_successes INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL
    CHECK(state IN ('ROLLING_BACK','RECOVERING','STABLE')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queue_takeover_transactions (
  run_key TEXT PRIMARY KEY,
  previous_worker_id TEXT,
  new_worker_id TEXT,
  previous_fencing_version BIGINT NOT NULL,
  new_fencing_version BIGINT,
  result TEXT NOT NULL
    CHECK(result IN ('TAKEN_OVER','REJECTED','CONFLICT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drift_aware_calibration (
  model_key TEXT PRIMARY KEY,
  window_size INTEGER NOT NULL,
  drift_ratio NUMERIC(12,5) NOT NULL DEFAULT 1,
  target_coverage NUMERIC(7,4) NOT NULL,
  last_coverage NUMERIC(7,4),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_routing_state (
  fingerprint TEXT PRIMARY KEY,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  suppressed_until TIMESTAMPTZ,
  route TEXT NOT NULL
    CHECK(route IN ('NONE','OPS','SECURITY','GOVERNANCE')),
  escalation_level INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retry_events_time
ON serializable_retry_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_stage_state
ON canary_recovery_stages(state,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_takeover_time
ON queue_takeover_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calibration_drift
ON drift_aware_calibration(drift_ratio DESC);

CREATE INDEX IF NOT EXISTS idx_alert_routing
ON alert_routing_state(route,updated_at DESC);
