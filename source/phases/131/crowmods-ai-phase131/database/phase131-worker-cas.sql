CREATE OR REPLACE FUNCTION failover_worker_cas(
 p_worker_key TEXT,
 p_expected_version BIGINT,
 p_new_worker_id TEXT,
 p_new_lease_token TEXT,
 p_new_lease_expires_at TIMESTAMPTZ
)
RETURNS TABLE(result TEXT, committed_version BIGINT, affected_rows INTEGER)
LANGUAGE plpgsql AS $$
DECLARE v_rows INTEGER; v_version BIGINT;
BEGIN
 UPDATE worker_lease_failover
 SET active_worker_id=p_new_worker_id,
     lease_token=p_new_lease_token,
     fencing_version=fencing_version+1,
     lease_expires_at=p_new_lease_expires_at,
     state='FAILED_OVER',
     updated_at=NOW()
 WHERE worker_key=p_worker_key
   AND fencing_version=p_expected_version
   AND (lease_expires_at IS NULL OR lease_expires_at<=NOW())
 RETURNING fencing_version INTO v_version;
 GET DIAGNOSTICS v_rows=ROW_COUNT;
 IF v_rows<>1 THEN
   RETURN QUERY SELECT 'CONFLICT',NULL::BIGINT,v_rows; RETURN;
 END IF;
 RETURN QUERY SELECT 'FAILED_OVER',v_version,v_rows;
END $$;

CREATE OR REPLACE FUNCTION renew_worker_lease_cas(
 p_worker_key TEXT,
 p_worker_id TEXT,
 p_lease_token TEXT,
 p_expected_version BIGINT,
 p_new_lease_expires_at TIMESTAMPTZ
)
RETURNS TABLE(result TEXT, committed_version BIGINT, affected_rows INTEGER)
LANGUAGE plpgsql AS $$
DECLARE v_rows INTEGER; v_version BIGINT;
BEGIN
 UPDATE worker_lease_failover
 SET lease_expires_at=p_new_lease_expires_at,
     last_renewed_at=NOW(),
     updated_at=NOW()
 WHERE worker_key=p_worker_key
   AND active_worker_id=p_worker_id
   AND lease_token=p_lease_token
   AND fencing_version=p_expected_version
   AND lease_expires_at>NOW()
 RETURNING fencing_version INTO v_version;
 GET DIAGNOSTICS v_rows=ROW_COUNT;
 IF v_rows<>1 THEN
   RETURN QUERY SELECT 'CONFLICT',NULL::BIGINT,v_rows; RETURN;
 END IF;
 RETURN QUERY SELECT 'RENEWED',v_version,v_rows;
END $$;
