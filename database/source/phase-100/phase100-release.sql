CREATE TABLE IF NOT EXISTS release_validation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_version TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('PASS','FAIL','BLOCKED')),
  passed_checks INTEGER NOT NULL DEFAULT 0,
  failed_checks INTEGER NOT NULL DEFAULT 0,
  blocked_checks INTEGER NOT NULL DEFAULT 0,
  manifest_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS release_evidence_manifest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_version TEXT NOT NULL,
  artifact_name TEXT NOT NULL,
  artifact_hash TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(release_version,artifact_name)
);

CREATE INDEX IF NOT EXISTS idx_release_validation_time
ON release_validation_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_release_manifest_version
ON release_evidence_manifest(release_version,created_at DESC);
