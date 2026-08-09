CREATE TABLE IF NOT EXISTS consumer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumer_offsets_v2 (
  consumer_group TEXT PRIMARY KEY,
  last_event_stream_id BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processed_events (
  consumer_group TEXT NOT NULL,
  event_id UUID NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(consumer_group,event_id)
);

CREATE TABLE IF NOT EXISTS consumer_metrics (
  id BIGSERIAL PRIMARY KEY,
  consumer_group TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_events_group_time
ON processed_events(consumer_group,processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_consumer_metrics_group_time
ON consumer_metrics(consumer_group,observed_at DESC);
