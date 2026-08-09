CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO'
    CHECK(severity IN ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
  service TEXT,
  actor_ref TEXT,
  ip_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_controls (
  control_name TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reason TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_controls(control_name,enabled,reason)
VALUES
  ('publishing_enabled',TRUE,'Default enabled'),
  ('new_uploads_enabled',TRUE,'Default enabled'),
  ('new_registrations_enabled',TRUE,'Default enabled')
ON CONFLICT(control_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS security_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'TODO'
    CHECK(status IN ('TODO','IN_PROGRESS','PASS','FAIL','WAIVED')),
  owner_ref TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_time
ON security_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_severity
ON security_events(severity,created_at DESC);
