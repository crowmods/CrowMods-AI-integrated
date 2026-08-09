CREATE OR REPLACE FUNCTION atomic_calibration_commit(
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
    AND EXISTS(
      SELECT 1
      FROM calibration_binding_cas b
      WHERE b.model_key=p_model_key
        AND b.owner_id=p_owner_id
        AND b.fencing_version=p_fencing_version
    )
  RETURNING c.checkpoint_version INTO v_new;

  IF v_new IS NULL THEN
    RETURN QUERY SELECT 'CONFLICT',NULL::BIGINT;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'COMMITTED',v_new;
END $$;
