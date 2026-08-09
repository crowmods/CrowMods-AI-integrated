CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  title TEXT NOT NULL,
  canonical_url TEXT,
  source_ref TEXT,
  content TEXT NOT NULL,
  trust_level TEXT NOT NULL DEFAULT 'VERIFIED'
    CHECK(trust_level IN ('VERIFIED','INTERNAL','UNVERIFIED')),
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('ACTIVE','ARCHIVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_estimate INTEGER NOT NULL DEFAULT 0,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', content)
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_id,chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_search
ON knowledge_chunks USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status
ON knowledge_sources(status,trust_level);
