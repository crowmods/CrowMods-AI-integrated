CREATE TABLE IF NOT EXISTS retry_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_key TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  outcome TEXT NOT NULL
    CHECK(outcome IN ('SUCCESS','RETRY','OPEN_CIRCUIT','ABORTED')),
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS circuit_breakers (
  breaker_key TEXT PRIMARY KEY,
  state TEXT NOT NULL
    CHECK(state IN ('CLOSED','OPEN','HALF_OPEN')),
  failure_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  opened_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canary_recovery_controller (
  rollout_key TEXT PRIMARY KEY,
  state TEXT NOT NULL
    CHECK(state IN ('ROLLBACK','RECOVERY','STABLE')),
  traffic_percent NUMERIC(6,3) NOT NULL DEFAULT 0,
  recovery_stage INTEGER NOT NULL DEFAULT 0,
  consecutive_successes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verified_takeover_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL,
  expected_version BIGINT NOT NULL,
  committed_version BIGINT,
  result TEXT NOT NULL
    CHECK(result IN ('TAKEN_OVER','REJECTED','CONFLICT')),
  affected_rows INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS joint_calibration_state (
  model_key TEXT PRIMARY KEY,
  window_size INTEGER NOT NULL,
  drift_ratio NUMERIC(12,5) NOT NULL DEFAULT 1,
  coverage_error NUMERIC(10,5) NOT NULL DEFAULT 0,
  controller_action TEXT NOT NULL
    CHECK(controller_action IN ('EXPAND','SHRINK','HOLD')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL,
  action TEXT NOT NULL
    CHECK(action IN ('CREATED','ACKNOWLEDGED','SUPPRESSED','UNSUPPRESSED','ESCALATED','ROUTED')),
  actor TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retry_telemetry_time
ON retry_telemetry(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_breaker_state
ON circuit_breakers(state,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_canary_controller_state
ON canary_recovery_controller(state,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_takeover_events_time
ON verified_takeover_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_joint_calibration_time
ON joint_calibration_state(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_audit_fingerprint
ON alert_audit_events(fingerprint,created_at DESC);
