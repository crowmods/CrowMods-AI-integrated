CREATE TABLE IF NOT EXISTS retention_execution_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key TEXT NOT NULL,
  handler_key TEXT NOT NULL,
  run_id UUID,
  requested_by TEXT NOT NULL,
  examined_count INTEGER NOT NULL DEFAULT 0,
  purged_count INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL CHECK(result IN ('COMPLETED','DRY_RUN','DENIED','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retry_rolling_baselines (
  run_key TEXT PRIMARY KEY,
  sample_count INTEGER NOT NULL DEFAULT 0,
  p50_ms NUMERIC(12,3),
  p95_ms NUMERIC(12,3),
  p99_ms NUMERIC(12,3),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_checkpoint_cas (
  model_key TEXT PRIMARY KEY,
  checkpoint_version BIGINT NOT NULL DEFAULT 0,
  action TEXT NOT NULL,
  window_size INTEGER NOT NULL,
  stable_cycles INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manifest_integrity_state (
  export_id UUID PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK(verification_status IN ('VERIFIED','MISMATCH','PENDING')),
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retention_execution_time
ON retention_execution_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_retry_baseline_time
ON retry_rolling_baselines(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_calibration_checkpoint_time
ON calibration_checkpoint_cas(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_manifest_integrity_status
ON manifest_integrity_state(verification_status,updated_at DESC);
