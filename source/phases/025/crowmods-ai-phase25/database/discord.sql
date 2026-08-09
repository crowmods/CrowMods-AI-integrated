CREATE TABLE IF NOT EXISTS discord_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  guild_id TEXT,
  channel_id TEXT NOT NULL UNIQUE,
  bot_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discord_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
  destination_id UUID NOT NULL REFERENCES discord_destinations(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','PENDING_APPROVAL','APPROVED','SCHEDULED','QUEUED','PUBLISHED','FAILED','CANCELLED')),
  scheduled_for TIMESTAMPTZ,
  discord_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_discord_posts_schedule
ON discord_posts(status,scheduled_for);
