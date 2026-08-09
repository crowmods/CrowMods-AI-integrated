CREATE TABLE IF NOT EXISTS resilience_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  observed_value DOUBLE PRECISION NOT NULL,
  baseline_value DOUBLE PRECISION NOT NULL,
  deviation_score DOUBLE PRECISION NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('INFO','WARNING','HIGH','CRITICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resilience_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL,
  region_name TEXT,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  escalation_level INTEGER NOT NULL DEFAULT 0,
  occurrences INTEGER NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dedupe_key)
);

CREATE TABLE IF NOT EXISTS alert_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name TEXT NOT NULL UNIQUE,
  severity_min TEXT NOT NULL DEFAULT 'WARNING',
  destination_type TEXT NOT NULL,
  destination_ref TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS executive_resilience_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  overall_score DOUBLE PRECISION NOT NULL,
  trend DOUBLE PRECISION NOT NULL,
  anomaly_count INTEGER NOT NULL,
  open_alert_count INTEGER NOT NULL,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_region_time
ON resilience_anomalies(region_name,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_events_seen
ON resilience_alert_events(last_seen_at DESC);
