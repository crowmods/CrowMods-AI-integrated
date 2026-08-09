CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_intelligence_id UUID REFERENCES release_intelligence(id) ON DELETE SET NULL,
  original_name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  sha256 CHAR(64),
  alt_text TEXT,
  caption TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','REVIEW','APPROVED','REJECTED','ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  variant_type TEXT NOT NULL,
  object_key TEXT,
  width INTEGER,
  height INTEGER,
  caption TEXT,
  alt_text TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','REVIEW','APPROVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_release
ON media_assets(release_intelligence_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_variants_platform
ON media_variants(platform,status);
