CREATE TABLE IF NOT EXISTS worker_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_workflow_tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK(status IN ('QUEUED','LEASED','RUNNING','VERIFYING','SUCCEEDED','RETRYING','FAILED','CANCELLED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_until TIMESTAMPTZ,
  worker_id TEXT,
  last_error TEXT,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tool_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  permission TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'LOW'
    CHECK(risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  model_name TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  secret_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_results (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES worker_jobs(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  checks JSONB NOT NULL DEFAULT '{}'::jsonb,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tool_registry
  (tool_name,description,permission,risk_level,requires_approval)
VALUES
 ('knowledge.search','Search approved knowledge sources','knowledge.read','LOW',FALSE),
 ('analytics.read','Read approved analytics metrics','analytics.read','LOW',FALSE),
 ('support.draft','Draft a support response','support.write','LOW',FALSE),
 ('campaign.draft','Draft campaign content','campaigns.write','LOW',FALSE),
 ('release.validate','Validate release metadata','releases.write','MEDIUM',FALSE),
 ('release.publish','Publish an approved release','releases.write','HIGH',TRUE),
 ('campaign.publish','Publish an approved campaign','campaigns.write','HIGH',TRUE),
 ('moderation.action','Execute an authorized moderation action','community.moderate','HIGH',TRUE)
ON CONFLICT(tool_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_worker_jobs_queue
ON worker_jobs(status,run_after,created_at);

CREATE INDEX IF NOT EXISTS idx_worker_jobs_lease
ON worker_jobs(lease_until);

CREATE INDEX IF NOT EXISTS idx_verification_job
ON verification_results(job_id,created_at DESC);
