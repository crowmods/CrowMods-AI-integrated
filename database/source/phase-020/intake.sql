CREATE TABLE IF NOT EXISTS upload_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT,
  size_bytes BIGINT NOT NULL CHECK(size_bytes >= 0),
  sha256 CHAR(64),
  status TEXT NOT NULL DEFAULT 'QUARANTINED'
    CHECK(status IN ('QUARANTINED','PROCESSING','SCANNED','REJECTED','APPROVED','PUBLISHED')),
  scan_status TEXT NOT NULL DEFAULT 'NOT_SCANNED'
    CHECK(scan_status IN ('NOT_SCANNED','QUEUED','RUNNING','CLEAN','SUSPICIOUS','MALICIOUS','ERROR')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_assets_status
ON upload_assets(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_upload_assets_sha256
ON upload_assets(sha256);
