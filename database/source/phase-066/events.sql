CREATE TABLE IF NOT EXISTS event_stream (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  source_service TEXT NOT NULL,
  correlation_id UUID NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumer_offsets (
  consumer_name TEXT PRIMARY KEY,
  last_event_id BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_dependencies (
  id BIGSERIAL PRIMARY KEY,
  source_service TEXT NOT NULL,
  target_service TEXT NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'RUNTIME',
  criticality TEXT NOT NULL DEFAULT 'NORMAL'
    CHECK(criticality IN ('LOW','NORMAL','HIGH','CRITICAL')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(source_service,target_service,dependency_type)
);

CREATE TABLE IF NOT EXISTS dependency_incident_links (
  id BIGSERIAL PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES routed_incidents(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  relationship TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_stream_type_time
ON event_stream(event_type,occurred_at);

CREATE INDEX IF NOT EXISTS idx_event_stream_correlation
ON event_stream(correlation_id,occurred_at);

CREATE INDEX IF NOT EXISTS idx_dependencies_source
ON service_dependencies(source_service,enabled);

CREATE INDEX IF NOT EXISTS idx_dependencies_target
ON service_dependencies(target_service,enabled);
