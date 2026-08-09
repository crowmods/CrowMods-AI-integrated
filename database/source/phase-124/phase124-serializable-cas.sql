-- Production CAS primitive.
-- The SELECT FOR UPDATE and version check occur in one SERIALIZABLE transaction.

CREATE OR REPLACE FUNCTION cas_protected_resource(
  p_resource_key TEXT,
  p_expected_version BIGINT,
  p_next_digest TEXT
)
RETURNS TABLE(
  committed BOOLEAN,
  committed_version BIGINT,
  reason TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_version BIGINT;
BEGIN
  SELECT fencing_version
    INTO v_version
    FROM protected_resources
    WHERE resource_key = p_resource_key
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::BIGINT, 'resource_not_found';
    RETURN;
  END IF;

  IF v_version <> p_expected_version THEN
    RETURN QUERY SELECT FALSE, v_version, 'compare_and_swap_conflict';
    RETURN;
  END IF;

  UPDATE protected_resources
     SET fencing_version = v_version + 1,
         state_digest = p_next_digest,
         updated_at = NOW()
   WHERE resource_key = p_resource_key
     AND fencing_version = p_expected_version;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, v_version, 'atomic_update_conflict';
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_version + 1, 'committed';
END;
$$;
