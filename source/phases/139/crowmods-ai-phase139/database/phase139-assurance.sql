CREATE TABLE IF NOT EXISTS alert_recovery_policy (
  alert_key TEXT PRIMARY KEY,
  recovery_cooldown_until TIMESTAMPTZ,
  escalation_count INTEGER NOT NULL DEFAULT 0,
  escalation_cap INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_checkpoint_bindings (
  model_key TEXT NOT NULL,
  fencing_version BIGINT NOT NULL,
  checkpoint_version BIGINT NOT NULL,
  owner_id TEXT NOT NULL,
  bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(model_key,fencing_version)
);

CREATE TABLE IF NOT EXISTS manifest_verification_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  export_id UUID NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('VERIFIED','MISMATCH','FAILED')),
  payload_hash TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_recovery_policy
ON alert_recovery_policy(recovery_cooldown_until,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_calibration_bindings
ON calibration_checkpoint_bindings(model_key,checkpoint_version DESC);

CREATE INDEX IF NOT EXISTS idx_manifest_idempotency_export
ON manifest_verification_idempotency(export_id,created_at DESC);

CREATE OR REPLACE FUNCTION purge_eligible_rows(
  p_table_name TEXT,
  p_retention_days INTEGER,
  p_batch_size INTEGER
)
RETURNS TABLE(record_key TEXT)
LANGUAGE plpgsql AS $$
BEGIN
  IF p_table_name='alert_ack_history' THEN
    RETURN QUERY EXECUTE
      'SELECT id::text FROM alert_ack_history
       WHERE created_at < NOW() - ($1 || '' days'')::interval
       ORDER BY created_at ASC
       FOR UPDATE SKIP LOCKED LIMIT $2'
      USING p_retention_days,p_batch_size;
  ELSIF p_table_name='retry_latency_samples' THEN
    RETURN QUERY EXECUTE
      'SELECT id::text FROM retry_latency_samples
       WHERE created_at < NOW() - ($1 || '' days'')::interval
       ORDER BY created_at ASC
       FOR UPDATE SKIP LOCKED LIMIT $2'
      USING p_retention_days,p_batch_size;
  ELSE
    RAISE EXCEPTION 'table_not_allowlisted';
  END IF;
END $$;
