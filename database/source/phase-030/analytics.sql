CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
  platform TEXT,
  source TEXT,
  anonymous_session_id TEXT,
  value NUMERIC(14,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_time
ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name
ON analytics_events(event_name,created_at DESC);

CREATE TABLE IF NOT EXISTS revenue_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_events_time
ON revenue_events(created_at DESC);
