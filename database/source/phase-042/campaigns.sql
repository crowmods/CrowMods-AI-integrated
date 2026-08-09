CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_page_id UUID NOT NULL REFERENCES release_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT 'AWARENESS',
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','REVIEW','APPROVED','SCHEDULED','RUNNING','COMPLETED','CANCELLED')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  media_asset_ids UUID[] NOT NULL DEFAULT '{}',
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','REVIEW','APPROVED','QUEUED','PUBLISHED','FAILED','CANCELLED')),
  external_post_ref TEXT,
  error_message TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_events (
  id BIGSERIAL PRIMARY KEY,
  campaign_post_id UUID REFERENCES campaign_posts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_status
ON campaigns(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_posts_queue
ON campaign_posts(status,scheduled_for);

CREATE INDEX IF NOT EXISTS idx_campaign_events_time
ON campaign_events(created_at DESC);
