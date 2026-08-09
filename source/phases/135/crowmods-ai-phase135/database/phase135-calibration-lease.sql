CREATE OR REPLACE FUNCTION acquire_calibration_lease(
 p_model_key TEXT,
 p_owner_id TEXT,
 p_lease_token TEXT,
 p_expected_version BIGINT,
 p_lease_expires_at TIMESTAMPTZ
)
RETURNS TABLE(result TEXT, fencing_version BIGINT)
LANGUAGE plpgsql AS $$
DECLARE v_version BIGINT;
BEGIN
 INSERT INTO calibration_checkpoint_leases(
   model_key,owner_id,lease_token,fencing_version,lease_expires_at
 )
 VALUES(p_model_key,p_owner_id,p_lease_token,
        COALESCE(p_expected_version,0)+1,p_lease_expires_at)
 ON CONFLICT(model_key) DO UPDATE
 SET owner_id=EXCLUDED.owner_id,
     lease_token=EXCLUDED.lease_token,
     fencing_version=calibration_checkpoint_leases.fencing_version+1,
     lease_expires_at=EXCLUDED.lease_expires_at,
     updated_at=NOW()
 WHERE calibration_checkpoint_leases.fencing_version=p_expected_version
   AND calibration_checkpoint_leases.lease_expires_at<=NOW()
 RETURNING fencing_version INTO v_version;

 IF v_version IS NULL THEN
   RETURN QUERY SELECT 'CONFLICT',NULL::BIGINT;
   RETURN;
 END IF;

 RETURN QUERY SELECT 'ACQUIRED',v_version;
END $$;
