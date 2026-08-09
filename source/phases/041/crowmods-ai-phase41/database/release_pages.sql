CREATE TABLE IF NOT EXISTS release_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_id UUID NOT NULL REFERENCES release_intelligence(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  version_name TEXT,
  version_code TEXT,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  structured_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  download JSONB NOT NULL DEFAULT '{}'::jsonb,
  related_releases JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_release_pages_status
ON release_pages(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_release_pages_slug
ON release_pages(slug);
