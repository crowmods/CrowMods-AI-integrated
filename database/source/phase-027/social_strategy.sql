CREATE TABLE IF NOT EXISTS strategy_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
  recommendation_type TEXT NOT NULL,
  recommendation JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(5,4),
  status TEXT NOT NULL DEFAULT 'NEW'
    CHECK(status IN ('NEW','ACCEPTED','DISMISSED','EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_release
ON strategy_recommendations(release_id,created_at DESC);

CREATE TABLE IF NOT EXISTS campaign_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES social_campaigns(id) ON DELETE CASCADE,
  experiment_name TEXT NOT NULL,
  variant_a JSONB NOT NULL DEFAULT '{}'::jsonb,
  variant_b JSONB NOT NULL DEFAULT '{}'::jsonb,
  metric_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNED'
    CHECK(status IN ('PLANNED','RUNNING','COMPLETED','CANCELLED')),
  winner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
