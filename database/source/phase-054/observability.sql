CREATE TABLE IF NOT EXISTS secret_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  secret_name TEXT NOT NULL,
  version_ref TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('ACTIVE','ROTATING','REVOKED','ERROR')),
  last_rotated_at TIMESTAMPTZ,
  next_rotation_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider,secret_name)
);

CREATE TABLE IF NOT EXISTS observability_events (
  id BIGSERIAL PRIMARY KEY,
  level TEXT NOT NULL
    CHECK(level IN ('DEBUG','INFO','WARN','ERROR','CRITICAL')),
  service TEXT NOT NULL,
  event_name TEXT NOT NULL,
  request_id TEXT,
  trace_id TEXT,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metric_samples (
  id BIGSERIAL PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','ACKNOWLEDGED','MITIGATED','RESOLVED')),
  title TEXT NOT NULL,
  description TEXT,
  service TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  metric_name TEXT NOT NULL,
  operator TEXT NOT NULL
    CHECK(operator IN ('GT','GTE','LT','LTE','EQ')),
  threshold DOUBLE PRECISION NOT NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_observability_events_time
ON observability_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_metric_samples_name
ON metric_samples(metric_name,sampled_at DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_status
ON incidents(status,severity,detected_at DESC);
