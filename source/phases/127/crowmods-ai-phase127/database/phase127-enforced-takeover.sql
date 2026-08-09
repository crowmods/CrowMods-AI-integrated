CREATE OR REPLACE FUNCTION verify_and_takeover_job(
  p_run_key TEXT,
  p_expected_version BIGINT,
  p_new_worker_id TEXT,
  p_new_lease_token TEXT,
  p_new_lease_expires_at TIMESTAMPTZ
)
RETURNS TABLE(
  result TEXT,
  committed_version BIGINT,
  affected_rows INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_rows INTEGER;
  v_version BIGINT;
BEGIN
  UPDATE delegation_queue_jobs
     SET worker_id = p_new_worker_id,
         lease_token = p_new_lease_token,
         fencing_version = fencing_version + 1,
         lease_expires_at = p_new_lease_expires_at,
         status = 'CLAIMED',
         updated_at = NOW()
   WHERE run_key = p_run_key
     AND status = 'CLAIMED'
     AND lease_expires_at <= NOW()
     AND fencing_version = p_expected_version
  RETURNING fencing_version INTO v_version;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows <> 1 THEN
    RETURN QUERY SELECT
      'CONFLICT',
      NULL::BIGINT,
      v_rows;
    RETURN;
  END IF;

  IF v_version <> p_expected_version + 1 THEN
    RETURN QUERY SELECT
      'REJECTED',
      v_version,
      v_rows;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    'TAKEN_OVER',
    v_version,
    v_rows;
END;
$$;
