CREATE TABLE IF NOT EXISTS purge_outcome_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  record_key TEXT NOT NULL,
  table_name TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('PURGED','SKIPPED','FAILED')),
  audit_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_transition_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_key TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  reason TEXT NOT NULL,
  cooldown_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replay_cache_cleanup_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id TEXT NOT NULL,
  examined_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purge_outcome_run
ON purge_outcome_transactions(run_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_transition_key
ON alert_transition_history(alert_key,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_replay_cleanup_time
ON replay_cache_cleanup_metrics(created_at DESC);

CREATE OR REPLACE FUNCTION atomic_calibration_commit_fenced(
  p_model_key TEXT,
  p_owner_id TEXT,
  p_fencing_version BIGINT,
  p_expected_checkpoint BIGINT,
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
      FROM calibration_binding_cas b
      JOIN calibration_checkpoint_leases l
        ON l.model_key=b.model_key
       AND l.fencing_version=b.fencing_version
      WHERE b.model_key=p_model_key
        AND b.owner_id=p_owner_id
        AND b.fencing_version=p_fencing_version
        AND l.owner_id=p_owner_id
        AND l.fencing_version=p_fencing_version
        AND l.lease_expires_at>NOW()
    )
  RETURNING c.checkpoint_version INTO v_new;

  IF v_new IS NULL THEN
    RETURN QUERY SELECT 'CONFLICT',NULL::BIGINT;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'COMMITTED',v_new;
END $$;
