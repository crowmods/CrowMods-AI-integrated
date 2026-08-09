CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  account_label TEXT NOT NULL,
  provider_account_ref TEXT,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED'
    CHECK(status IN ('DISCONNECTED','CONNECTED','DEGRADED','REVOKED','ERROR')),
  scopes TEXT[] NOT NULL DEFAULT '{}',
  secret_ref TEXT,
  last_health_check TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connector_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_connection_id UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  campaign_post_id UUID,
  idempotency_key TEXT NOT NULL UNIQUE,
  operation TEXT NOT NULL CHECK(operation IN ('PUBLISH','SCHEDULE','STATUS','DELETE')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK(status IN ('QUEUED','PROCESSING','SUCCEEDED','RETRYING','FAILED','CANCELLED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  external_post_ref TEXT,
  last_error TEXT,
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS connector_events (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID REFERENCES connector_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connections_platform
ON platform_connections(platform,status);

CREATE INDEX IF NOT EXISTS idx_connector_jobs_queue
ON connector_jobs(status,run_after,created_at);

CREATE INDEX IF NOT EXISTS idx_connector_events_time
ON connector_events(created_at DESC);
