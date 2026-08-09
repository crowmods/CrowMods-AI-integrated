CREATE OR REPLACE FUNCTION delete_locked_purge_rows(
  p_table_name TEXT,
  p_retention_days INTEGER,
  p_batch_size INTEGER
)
RETURNS TABLE(record_key TEXT)
LANGUAGE plpgsql AS $$
BEGIN
  IF p_table_name='alert_ack_history' THEN
    RETURN QUERY EXECUTE
      'DELETE FROM alert_ack_history
       WHERE id IN (
         SELECT id FROM alert_ack_history
         WHERE created_at < NOW() -
           ($1 || '' days'')::interval
         ORDER BY created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $2
       )
       RETURNING id::text'
      USING p_retention_days,p_batch_size;
  ELSIF p_table_name='retry_latency_samples' THEN
    RETURN QUERY EXECUTE
      'DELETE FROM retry_latency_samples
       WHERE id IN (
         SELECT id FROM retry_latency_samples
         WHERE created_at < NOW() -
           ($1 || '' days'')::interval
         ORDER BY created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $2
       )
       RETURNING id::text'
      USING p_retention_days,p_batch_size;
  ELSE
    RAISE EXCEPTION 'table_not_allowlisted';
  END IF;
END $$;
