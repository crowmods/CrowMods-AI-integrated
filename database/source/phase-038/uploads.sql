CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT,
  size_bytes BIGINT NOT NULL CHECK(size_bytes >= 0),
  sha256 CHAR(64) NOT NULL,
  storage_zone TEXT NOT NULL DEFAULT 'QUARANTINE'
    CHECK(storage_zone IN ('QUARANTINE','RELEASE')),
  scan_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(scan_status IN ('PENDING','SCANNING','CLEAN','INFECTED','ERROR')),
  approval_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(approval_status IN ('PENDING','APPROVED','REJECTED')),
  uploader_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scanned_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS upload_scan_events (
  id BIGSERIAL PRIMARY KEY,
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  scanner TEXT NOT NULL,
  status TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_status
ON uploads(scan_status,approval_status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_uploads_sha256
ON uploads(sha256);
