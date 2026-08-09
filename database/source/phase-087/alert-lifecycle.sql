CREATE TABLE IF NOT EXISTS alert_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID,
  event_type TEXT NOT NULL
    CHECK(event_type IN ('CREATED','ACKNOWLEDGED','RESOLVED','REOPENED','ESCALATED')),
  actor TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  alert_count INTEGER NOT NULL DEFAULT 0,
  slo_breach BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS incident_alerts (
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL,
  attached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(incident_id,alert_id)
);

CREATE TABLE IF NOT EXISTS telemetry_exports (
  id BIGSERIAL PRIMARY KEY,
  exporter TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','EXPORTED','FAILED')),
  error TEXT,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_lifecycle_alert_time
ON alert_lifecycle_events(alert_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_status_time
ON incidents(status,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_export_status
ON telemetry_exports(status,created_at DESC);
