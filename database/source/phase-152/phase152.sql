CREATE TABLE IF NOT EXISTS distributed_rate_limit_buckets (
  limiter_key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  window_seconds INTEGER NOT NULL DEFAULT 60,
  request_count INTEGER NOT NULL DEFAULT 0,
  limit_count INTEGER NOT NULL DEFAULT 5,
  state TEXT NOT NULL CHECK(state IN ('ALLOW','THROTTLED','ESCALATED')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distributed_rate_updated
ON distributed_rate_limit_buckets(updated_at DESC);
