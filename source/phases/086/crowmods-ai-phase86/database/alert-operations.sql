CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID,
  provider TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','SENT','FAILED','DLQ')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS alert_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suppression_key TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observability_metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anomaly_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL UNIQUE,
  metric_name TEXT NOT NULL,
  threshold DOUBLE PRECISION NOT NULL,
  severity TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_key TEXT NOT NULL UNIQUE,
  incident_id UUID,
  alert_count INTEGER NOT NULL DEFAULT 1,
  slo_breach BOOLEAN NOT NULL DEFAULT FALSE,
  highest_severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_status
ON notification_deliveries(status,next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_metrics_name_time
ON observability_metrics(metric_name,observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_correlations_status
ON alert_correlations(status,updated_at DESC);
