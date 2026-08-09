CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK(asset_type IN (
    'ICON','SCREENSHOT','BANNER','THUMBNAIL','TELEGRAM_ART','SOCIAL_ART'
  )),
  original_name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  sha256 CHAR(64),
  status TEXT NOT NULL DEFAULT 'QUARANTINED'
    CHECK(status IN ('QUARANTINED','PROCESSING','READY','REJECTED')),
  alt_text TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_release_type
ON media_assets(release_id,asset_type);
