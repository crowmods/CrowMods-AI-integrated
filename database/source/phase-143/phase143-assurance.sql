CREATE TABLE IF NOT EXISTS purge_reconciliation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  record_key TEXT NOT NULL,
  audit_outcome TEXT NOT NULL,
  execution_outcome TEXT NOT NULL,
  reconciliation TEXT NOT NULL
    CHECK(reconciliation IN ('MATCH','MISMATCH','MISSING_AUDIT','MISSING_OUTCOME')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_recovery_slo_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_key TEXT NOT NULL,
  incident_started_at TIMESTAMPTZ NOT NULL,
  recovered_at TIMESTAMPTZ,
  recovery_seconds INTEGER,
  target_seconds INTEGER NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('MET','MISSED','OPEN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replay_conflict_quarantine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  export_id UUID NOT NULL,
  reason TEXT NOT NULL,
  payload_hash TEXT,
  manifest_hash TEXT,
  quarantined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_purge_reconciliation_time
ON purge_reconciliation_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_slo_time
ON alert_recovery_slo_samples(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_replay_quarantine_key
ON replay_conflict_quarantine(idempotency_key,quarantined_at DESC);

CREATE OR REPLACE FUNCTION renew_and_commit_calibration(
  p_model_key TEXT,
  p_owner_id TEXT,
  p_lease_token TEXT,
  p_fencing_version BIGINT,
  p_expected_checkpoint BIGINT,
  p_new_lease_expiry TIMESTAMPTZ,
  p_action TEXT,
  p_window_size INTEGER
)
RETURNS TABLE(result TEXT,new_checkpoint_version BIGINT)
LANGUAGE plpgsql AS $$
DECLARE v_new BIGINT;
BEGIN
  UPDATE calibration_checkpoint_cas c
  SET checkpoint_version=c.checkpoint_version+1,
      action=p_action,
      window_size=p_window_size,
      updated_at=NOW()
  WHERE c.model_key=p_model_key
    AND c.checkpoint_version=p_expected_checkpoint
    AND EXISTS (
      SELECT 1
      FROM calibration_checkpoint_leases l
      WHERE l.model_key=p_model_key
        AND l.owner_id=p_owner_id
        AND l.lease_token=p_lease_token
        AND l.fencing_version=p_fencing_version
        AND l.lease_expires_at>NOW()
    );

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'CONFLICT',NULL::BIGINT;
    RETURN;
  END IF;

  UPDATE calibration_checkpoint_leases
  SET lease_expires_at=p_new_lease_expiry,
      updated_at=NOW()
  WHERE model_key=p_model_key
    AND owner_id=p_owner_id
    AND lease_token=p_lease_token
    AND fencing_version=p_fencing_version;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'CONFLICT',NULL::BIGINT;
    RETURN;
  END IF;

  SELECT checkpoint_version INTO v_new
  FROM calibration_checkpoint_cas
  WHERE model_key=p_model_key;

  RETURN QUERY SELECT 'COMMITTED',v_new;
END $$;
