CREATE TABLE IF NOT EXISTS reconciliation_repair_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  record_key TEXT NOT NULL,
  mismatch_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('OPEN','CLAIMED','REPAIRED','REJECTED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  claimed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  repaired_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS recovery_slo_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  alert_class TEXT NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  met_count INTEGER NOT NULL DEFAULT 0,
  missed_count INTEGER NOT NULL DEFAULT 0,
  open_count INTEGER NOT NULL DEFAULT 0,
  compliance_ratio NUMERIC(8,5) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lease_renewal_fencing_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  fencing_version BIGINT NOT NULL,
  lease_token_hash TEXT NOT NULL,
  old_expiry TIMESTAMPTZ,
  new_expiry TIMESTAMPTZ,
  result TEXT NOT NULL CHECK(result IN ('RENEWED','CONFLICT','DENIED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quarantine_resolution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarantine_id UUID NOT NULL,
  operator_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('RELEASE','REJECT','REPROCESS')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_queue_status
ON reconciliation_repair_queue(status,created_at);

CREATE INDEX IF NOT EXISTS idx_slo_aggregate_period
ON recovery_slo_aggregates(period_start,period_end,alert_class);

CREATE INDEX IF NOT EXISTS idx_lease_fencing_audit_time
ON lease_renewal_fencing_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quarantine_resolution
ON quarantine_resolution_history(quarantine_id,created_at DESC);
