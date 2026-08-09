CREATE TABLE IF NOT EXISTS telegram_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  chat_id TEXT NOT NULL UNIQUE,
  bot_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
  channel_id UUID NOT NULL REFERENCES telegram_channels(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  media_object_key TEXT,
  buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','PENDING_APPROVAL','APPROVED','SCHEDULED','QUEUED','PUBLISHED','FAILED','CANCELLED')),
  scheduled_for TIMESTAMPTZ,
  telegram_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_telegram_posts_schedule
ON telegram_posts(status,scheduled_for);
