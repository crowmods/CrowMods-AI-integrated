CREATE TABLE IF NOT EXISTS security_slos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_key TEXT NOT NULL UNIQUE,
  slo_name TEXT NOT NULL,
  target_percent NUMERIC(6,3) NOT NULL,
  window_hours INTEGER NOT NULL,
  owner TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_slo_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_id UUID REFERENCES security_slos(id) ON DELETE CASCADE,
  total_events INTEGER NOT NULL,
  successful_events INTEGER NOT NULL,
  availability_percent NUMERIC(7,3) NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('PASS','BREACH','BLOCKED')),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_slo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_id UUID REFERENCES security_slos(id) ON DELETE SET NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('MEDIUM','HIGH','CRITICAL')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','ACKNOWLEDGED','CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workload_identity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  subject TEXT NOT NULL,
  audience TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('ACCEPTED','REJECTED','BLOCKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slo_measurements_time
ON security_slo_measurements(measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_slo_alerts_status
ON security_slo_alerts(status,severity,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workload_identity_time
ON workload_identity_events(created_at DESC);
