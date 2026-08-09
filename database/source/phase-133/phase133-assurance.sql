CREATE TABLE IF NOT EXISTS retention_purge_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key TEXT NOT NULL,
  batch_size INTEGER NOT NULL,
  examined_count INTEGER NOT NULL DEFAULT 0,
  purged_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL CHECK(result IN ('COMPLETED','PARTIAL','FAILED','DRY_RUN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retention_purge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('PURGED','SKIPPED','FAILED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retry_trend_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL,
  current_p95_ms NUMERIC(12,3),
  baseline_p95_ms NUMERIC(12,3),
  deviation_ratio NUMERIC(12,5),
  severity TEXT NOT NULL CHECK(severity IN ('NORMAL','WARNING','CRITICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_recovery_state (
  model_key TEXT PRIMARY KEY,
  action TEXT NOT NULL CHECK(action IN ('EXPAND','SHRINK','HOLD','INSUFFICIENT_DATA')),
  window_size INTEGER NOT NULL,
  stable_cycles INTEGER NOT NULL DEFAULT 0,
  checkpoint_version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manifest_verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID,
  expected_payload_hash TEXT NOT NULL,
  actual_payload_hash TEXT NOT NULL,
  expected_manifest_hash TEXT NOT NULL,
  actual_manifest_hash TEXT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('VERIFIED','MISMATCH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retention_runs_time
ON retention_purge_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_retention_items_run
ON retention_purge_items(run_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_retry_anomaly_time
ON retry_trend_anomalies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calibration_recovery_time
ON calibration_recovery_state(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_manifest_verification_time
ON manifest_verification_events(created_at DESC);
