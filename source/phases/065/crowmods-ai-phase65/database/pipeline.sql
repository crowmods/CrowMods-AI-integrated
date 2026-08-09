CREATE TABLE IF NOT EXISTS pipeline_events (
  id BIGSERIAL PRIMARY KEY,
  correlation_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  service TEXT NOT NULL,
  severity TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_postmortems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routed_incident_id UUID NOT NULL REFERENCES routed_incidents(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  root_cause TEXT,
  impact TEXT,
  resolution TEXT,
  corrective_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','REVIEW','APPROVED','CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_correlation
ON pipeline_events(correlation_id,created_at);

CREATE INDEX IF NOT EXISTS idx_pipeline_type
ON pipeline_events(event_type,created_at DESC);
