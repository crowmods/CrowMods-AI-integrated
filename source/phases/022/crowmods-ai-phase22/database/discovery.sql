ALTER TABLE releases
  ADD COLUMN IF NOT EXISTS download_count BIGINT NOT NULL DEFAULT 0;

ALTER TABLE releases
  ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_releases_category_published
ON releases(category, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_releases_popularity
ON releases(download_count DESC, view_count DESC);

CREATE TABLE IF NOT EXISTS search_events (
  id BIGSERIAL PRIMARY KEY,
  query_text TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  anonymous_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_events_created
ON search_events(created_at DESC);
