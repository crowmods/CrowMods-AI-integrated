CREATE TABLE IF NOT EXISTS release_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  app_name TEXT,
  package_name TEXT,
  version_name TEXT,
  version_code TEXT,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  compatibility TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  changelog TEXT[] NOT NULL DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  source_facts JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(5,4),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','REVIEW','APPROVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS release_social_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_id UUID NOT NULL REFERENCES release_intelligence(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','APPROVED','REJECTED','PUBLISHED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_release_intelligence_upload
ON release_intelligence(upload_id);

CREATE INDEX IF NOT EXISTS idx_release_intelligence_status
ON release_intelligence(status,created_at DESC);
