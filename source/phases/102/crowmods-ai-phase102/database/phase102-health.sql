CREATE TABLE IF NOT EXISTS security_health_probes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_type TEXT NOT NULL,
  target TEXT,
  status TEXT NOT NULL
    CHECK(status IN ('PASS','WARN','FAIL','BLOCKED')),
  latency_ms INTEGER,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_id UUID REFERENCES security_health_probes(id) ON DELETE SET NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','ACKNOWLEDGED','CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_health_probes_time
ON security_health_probes(checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_health_alerts_status
ON security_health_alerts(status,severity,created_at DESC);
