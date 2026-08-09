CREATE OR REPLACE FUNCTION bind_calibration_cas(
  p_model_key TEXT,
  p_owner_id TEXT,
  p_fencing_version BIGINT,
  p_expected_fencing_version BIGINT,
  p_checkpoint_version BIGINT
)
RETURNS TABLE(result TEXT,fencing_version BIGINT)
LANGUAGE plpgsql AS $$
DECLARE v_version BIGINT;
BEGIN
  UPDATE calibration_binding_cas
  SET owner_id=p_owner_id,
      fencing_version=p_fencing_version,
      checkpoint_version=p_checkpoint_version,
      updated_at=NOW()
  WHERE model_key=p_model_key
    AND fencing_version=p_expected_fencing_version
  RETURNING fencing_version INTO v_version;

  IF v_version IS NULL THEN
    RETURN QUERY SELECT 'CONFLICT',NULL::BIGINT;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'BOUND',v_version;
END $$;
