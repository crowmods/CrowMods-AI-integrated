CREATE TABLE IF NOT EXISTS service_health (
  id BIGSERIAL PRIMARY KEY,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('UP','DEGRADED','DOWN')),
  latency_ms INTEGER,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  service_name TEXT,
  fingerprint TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','INVESTIGATING','MITIGATED','RESOLVED')),
  source_alert_id UUID REFERENCES monitoring_alerts(id) ON DELETE SET NULL,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS incident_timeline (
  id BIGSERIAL PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  actor_ref TEXT,
  action TEXT NOT NULL,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_service_time
ON service_health(service_name,checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_status_time
ON monitoring_alerts(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_status_time
ON incidents(status,created_at DESC);
