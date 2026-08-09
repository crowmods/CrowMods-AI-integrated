CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS release_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_version TEXT NOT NULL UNIQUE,
  commit_sha TEXT NOT NULL,
  api_image_digest TEXT NOT NULL,
  worker_image_digest TEXT NOT NULL,
  frontend_image_digest TEXT,
  status TEXT NOT NULL DEFAULT 'CANDIDATE'
    CHECK(status IN ('CANDIDATE','STAGING','CANARY','PROMOTED','ROLLED_BACK')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  promoted_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS deployment_checks (
  id BIGSERIAL PRIMARY KEY,
  release_id UUID NOT NULL REFERENCES release_manifests(id) ON DELETE CASCADE,
  check_name TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  observed_value DOUBLE PRECISION,
  threshold DOUBLE PRECISION,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_release_manifest_status
ON release_manifests(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deployment_checks_release
ON deployment_checks(release_id,created_at DESC);
