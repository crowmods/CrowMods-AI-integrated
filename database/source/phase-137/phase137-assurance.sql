CREATE TABLE IF NOT EXISTS alert_cooldown_state (
  alert_key TEXT PRIMARY KEY,
  severity TEXT NOT NULL CHECK(severity IN ('NORMAL','WARNING','CRITICAL')),
  consecutive_hits INTEGER NOT NULL DEFAULT 0,
  cooldown_until TIMESTAMPTZ,
  escalated BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_checkpoint_writes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  fencing_version BIGINT NOT NULL,
  checkpoint_version BIGINT NOT NULL,
  action TEXT NOT NULL,
  window_size INTEGER NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('COMMITTED','CONFLICT','DENIED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manifest_verification_worker_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id TEXT NOT NULL,
  batch_size INTEGER NOT NULL,
  examined_count INTEGER NOT NULL DEFAULT 0,
  verified_count INTEGER NOT NULL DEFAULT 0,
  mismatch_count INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL CHECK(result IN ('COMPLETED','PARTIAL','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_cooldown_state
ON alert_cooldown_state(cooldown_until,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkpoint_writes_time
ON calibration_checkpoint_writes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manifest_worker_runs
ON manifest_verification_worker_runs(created_at DESC);

CREATE OR REPLACE FUNCTION purge_row_if_eligible(
  p_created_at TIMESTAMPTZ,
  p_retention_days INTEGER
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE AS $$
  SELECT p_created_at <
    NOW() - (p_retention_days || ' days')::INTERVAL
$$;

CREATE OR REPLACE FUNCTION fenced_checkpoint_write(
  p_model_key TEXT,
  p_owner_id TEXT,
  p_fencing_version BIGINT,
  p_expected_checkpoint BIGINT,
  p_action TEXT,
  p_window_size INTEGER
)
RETURNS TABLE(result TEXT, checkpoint_version BIGINT)
LANGUAGE plpgsql AS $$
DECLARE v_version BIGINT;
BEGIN
  UPDATE calibration_checkpoint_cas
  SET checkpoint_version=checkpoint_version+1,
      action=p_action,
      window_size=p_window_size,
      updated_at=NOW()
  WHERE model_key=p_model_key
    AND checkpoint_version=p_expected_checkpoint
    AND EXISTS (
      SELECT 1
      FROM calibration_checkpoint_leases l
      WHERE l.model_key=p_model_key
        AND l.owner_id=p_owner_id
        AND l.fencing_version=p_fencing_version
        AND l.lease_expires_at>NOW()
    )
  RETURNING checkpoint_version INTO v_version;

  IF v_version IS NULL THEN
    RETURN QUERY SELECT 'CONFLICT',NULL::BIGINT;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'COMMITTED',v_version;
END $$;
