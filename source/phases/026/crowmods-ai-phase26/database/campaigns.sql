CREATE TABLE IF NOT EXISTS social_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','PENDING_APPROVAL','APPROVED','SCHEDULED','RUNNING','COMPLETED','FAILED','CANCELLED')),
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS social_campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES social_campaigns(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_ref TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','PENDING_APPROVAL','APPROVED','QUEUED','PUBLISHED','FAILED','CANCELLED')),
  external_post_id TEXT,
  error_message TEXT,
  published_at TIMESTAMPTZ,
  UNIQUE(campaign_id,platform,account_ref)
);

CREATE INDEX IF NOT EXISTS idx_campaign_targets_status
ON social_campaign_targets(status);

CREATE INDEX IF NOT EXISTS idx_campaign_schedule
ON social_campaigns(status,scheduled_for);
