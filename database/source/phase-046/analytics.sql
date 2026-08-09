CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  anonymous_id TEXT,
  session_id TEXT,
  release_id UUID,
  campaign_id UUID,
  platform TEXT,
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revenue_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK(amount_minor >= 0),
  currency CHAR(3) NOT NULL,
  anonymous_id TEXT,
  campaign_id UUID,
  release_id UUID,
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_time
ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name
ON analytics_events(event_name,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_campaign
ON analytics_events(campaign_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_revenue_time
ON revenue_events(created_at DESC);
