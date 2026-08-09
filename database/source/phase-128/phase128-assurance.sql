CREATE TABLE IF NOT EXISTS dependency_breaker_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependency_key TEXT NOT NULL,
  previous_state TEXT NOT NULL,
  next_state TEXT NOT NULL,
  failure_rate NUMERIC(10,5),
  timeout_rate NUMERIC(10,5),
  latency_p95_ms NUMERIC(12,3),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canary_recovery_schedule (
  rollout_key TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK(state IN ('ROLLBACK','COOLDOWN','RECOVERY','STABLE')),
  next_check_at TIMESTAMPTZ,
  cooldown_until TIMESTAMPTZ,
  stage INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS takeover_execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL,
  expected_version BIGINT NOT NULL,
  committed_version BIGINT,
  affected_rows INTEGER NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('TAKEN_OVER','CONFLICT','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sequential_coverage_monitor (
  model_key TEXT PRIMARY KEY,
  sample_count BIGINT NOT NULL DEFAULT 0,
  covered_count BIGINT NOT NULL DEFAULT 0,
  coverage NUMERIC(8,5),
  target_coverage NUMERIC(8,5) NOT NULL,
  lower_bound NUMERIC(8,5),
  upper_bound NUMERIC(8,5),
  status TEXT NOT NULL CHECK(status IN ('ON_TARGET','UNDER_COVERED','OVER_COVERED','INSUFFICIENT_DATA')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_ack_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('ACKNOWLEDGED','UNACKNOWLEDGED','COMMENTED')),
  actor TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breaker_events_dep_time
ON dependency_breaker_events(dependency_key,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_schedule_next
ON canary_recovery_schedule(next_check_at);

CREATE INDEX IF NOT EXISTS idx_takeover_execution_time
ON takeover_execution_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sequential_coverage_status
ON sequential_coverage_monitor(status,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_ack_history_fp
ON alert_ack_history(fingerprint,created_at DESC);
