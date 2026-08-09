CREATE TABLE IF NOT EXISTS dependency_circuit_metrics (
  dependency_key TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK(state IN ('CLOSED','OPEN','HALF_OPEN')),
  request_count BIGINT NOT NULL DEFAULT 0,
  failure_count BIGINT NOT NULL DEFAULT 0,
  timeout_count BIGINT NOT NULL DEFAULT 0,
  latency_p95_ms NUMERIC(12,3),
  failure_rate NUMERIC(10,5),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canary_persistent_cooldowns (
  rollout_key TEXT PRIMARY KEY,
  cooldown_until TIMESTAMPTZ,
  failure_streak INTEGER NOT NULL DEFAULT 0,
  recovery_streak INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL CHECK(state IN ('ROLLBACK','COOLDOWN','RECOVERY','STABLE')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS takeover_verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL,
  expected_version BIGINT NOT NULL,
  committed_version BIGINT,
  affected_rows INTEGER NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('TAKEN_OVER','CONFLICT','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coverage_confidence_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  sample_count INTEGER NOT NULL,
  coverage NUMERIC(8,5) NOT NULL,
  confidence_level NUMERIC(8,5) NOT NULL,
  lower_bound NUMERIC(8,5) NOT NULL,
  upper_bound NUMERIC(8,5) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_acknowledgements (
  fingerprint TEXT PRIMARY KEY,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dependency_metrics_state
ON dependency_circuit_metrics(state,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_canary_cooldowns
ON canary_persistent_cooldowns(state,cooldown_until);

CREATE INDEX IF NOT EXISTS idx_takeover_verification_time
ON takeover_verification_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coverage_confidence_time
ON coverage_confidence_metrics(model_key,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_ack_time
ON alert_acknowledgements(updated_at DESC);
