CREATE TABLE IF NOT EXISTS telemetry_samples (
  id BIGSERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slo_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  slo_name TEXT NOT NULL,
  target DOUBLE PRECISION NOT NULL,
  window_minutes INTEGER NOT NULL DEFAULT 60,
  max_error_rate DOUBLE PRECISION,
  max_latency_ms DOUBLE PRECISION,
  min_health_rate DOUBLE PRECISION,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(service,slo_name)
);

CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id BIGSERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  alert_name TEXT NOT NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  condition TEXT NOT NULL,
  observed_value DOUBLE PRECISION,
  threshold DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_telemetry_service_metric_time
ON telemetry_samples(service,metric_name,observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_status
ON monitoring_alerts(status,severity,created_at DESC);
