CREATE TABLE IF NOT EXISTS rebalance_events (
  id BIGSERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  partition_id INTEGER NOT NULL,
  consumer_group TEXT NOT NULL,
  previous_worker TEXT,
  new_worker TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dlq_execution_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dead_letter_id BIGINT NOT NULL REFERENCES event_dead_letters(id) ON DELETE CASCADE,
  consumer_group TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK(status IN ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lag_alerts (
  id BIGSERIAL PRIMARY KEY,
  consumer_group TEXT NOT NULL,
  topic TEXT,
  lag_value BIGINT NOT NULL,
  threshold BIGINT NOT NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rebalance_topic_group
ON rebalance_events(topic,consumer_group,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dlq_execution_status
ON dlq_execution_jobs(status,run_after);

CREATE INDEX IF NOT EXISTS idx_lag_alert_status
ON lag_alerts(status,consumer_group,created_at DESC);
