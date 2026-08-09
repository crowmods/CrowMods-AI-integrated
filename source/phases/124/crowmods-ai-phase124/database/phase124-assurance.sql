CREATE TABLE IF NOT EXISTS protected_resources (
  resource_key TEXT PRIMARY KEY,
  fencing_version BIGINT NOT NULL DEFAULT 0,
  state_digest TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canary_recovery_windows (
  rollout_key TEXT PRIMARY KEY,
  cooldown_until TIMESTAMPTZ,
  consecutive_successes INTEGER NOT NULL DEFAULT 0,
  recovery_state TEXT NOT NULL
    CHECK(recovery_state IN ('COOLDOWN','RECOVERING','STABLE')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delegation_queue_jobs (
  run_key TEXT PRIMARY KEY,
  delegation_id UUID,
  worker_id TEXT,
  lease_token TEXT,
  fencing_version BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL
    CHECK(status IN ('READY','CLAIMED','COMPLETED','EXPIRED')),
  lease_expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_windows (
  model_key TEXT PRIMARY KEY,
  window_size INTEGER NOT NULL,
  min_window INTEGER NOT NULL,
  max_window INTEGER NOT NULL,
  coverage_error NUMERIC(10,5),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS governance_alerts (
  fingerprint TEXT PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('INFO','WARNING','CRITICAL')),
  occurrences INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  escalated BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resources_updated
ON protected_resources(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_cooldown
ON canary_recovery_windows(cooldown_until);

CREATE INDEX IF NOT EXISTS idx_queue_jobs_lease
ON delegation_queue_jobs(status,lease_expires_at);

CREATE INDEX IF NOT EXISTS idx_calibration_updated
ON calibration_windows(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_severity
ON governance_alerts(severity,last_seen_at DESC);
