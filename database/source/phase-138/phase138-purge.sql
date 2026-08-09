CREATE OR REPLACE FUNCTION execute_purge_batch(
  p_run_id UUID,
  p_table_name TEXT,
  p_retention_days INTEGER,
  p_batch_size INTEGER
)
RETURNS TABLE(examined_count INTEGER,purged_count INTEGER)
LANGUAGE plpgsql AS $$
DECLARE v_examined INTEGER := 0;
DECLARE v_purged INTEGER := 0;
BEGIN
  IF p_table_name NOT IN ('alert_ack_history','retry_latency_samples',
                          'alert_review_queries') THEN
    RAISE EXCEPTION 'table_not_allowlisted';
  END IF;

  /*
   * The function is intentionally a policy boundary. Actual production
   * handlers should use table-specific, parameterized SQL rather than
   * interpolating identifiers or arbitrary predicates.
   */
  RETURN QUERY SELECT v_examined,v_purged;
END $$;
