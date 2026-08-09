CREATE TABLE IF NOT EXISTS purge_execution_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  examined_count INTEGER NOT NULL DEFAULT 0,
  purged_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL CHECK(result IN ('COMMITTED','DRY_RUN','ROLLED_BACK','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_escalation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_key TEXT NOT NULL,
  from_severity TEXT NOT NULL,
  to_severity TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('ESCALATE','RECOVER','HOLD','RESET')),
  consecutive_hits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_fenced_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  fencing_version BIGINT NOT NULL,
  checkpoint_version BIGINT NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manifest_verification_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL,
  worker_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('VERIFIED','MISMATCH','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purge_tx_time
ON purge_execution_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_escalation_time
ON alert_escalation_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calibration_fenced_time
ON calibration_fenced_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manifest_tx_time
ON manifest_verification_transactions(created_at DESC);
