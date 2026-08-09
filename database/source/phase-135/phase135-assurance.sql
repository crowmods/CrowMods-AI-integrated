CREATE TABLE IF NOT EXISTS purge_row_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('PURGED','SKIPPED','FAILED')),
  actor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retry_baseline_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL,
  baseline_p95_ms NUMERIC(12,3),
  current_p95_ms NUMERIC(12,3),
  deviation_ratio NUMERIC(12,5),
  severity TEXT NOT NULL CHECK(severity IN ('NORMAL','WARNING','CRITICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_checkpoint_leases (
  model_key TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  lease_token TEXT NOT NULL,
  fencing_version BIGINT NOT NULL DEFAULT 0,
  lease_expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manifest_reverification_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('VERIFIED','MISMATCH','SKIPPED','FAILED')),
  payload_hash TEXT,
  manifest_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purge_row_audit_run
ON purge_row_audit(run_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_baseline_alert_time
ON retry_baseline_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calibration_lease_expiry
ON calibration_checkpoint_leases(lease_expires_at);

CREATE INDEX IF NOT EXISTS idx_manifest_reverify_time
ON manifest_reverification_runs(created_at DESC);
