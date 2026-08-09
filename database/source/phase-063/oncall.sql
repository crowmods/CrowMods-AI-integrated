CREATE TABLE IF NOT EXISTS oncall_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oncall_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES oncall_schedules(id) ON DELETE CASCADE,
  member_ref TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'PRIMARY',
  priority INTEGER NOT NULL DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escalation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  schedule_id UUID REFERENCES oncall_schedules(id) ON DELETE SET NULL,
  ack_timeout_minutes INTEGER NOT NULL DEFAULT 10,
  max_escalations INTEGER NOT NULL DEFAULT 3,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  service TEXT NOT NULL,
  severity TEXT NOT NULL,
  policy_id UUID REFERENCES escalation_policies(id) ON DELETE SET NULL,
  destination TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routed_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  service TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','ACKNOWLEDGED','ESCALATED','RESOLVED')),
  assigned_member TEXT,
  escalation_level INTEGER NOT NULL DEFAULT 0,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_events (
  id BIGSERIAL PRIMARY KEY,
  routed_incident_id UUID NOT NULL REFERENCES routed_incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  actor TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routed_incidents_status
ON routed_incidents(status,severity,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_events_incident
ON incident_events(routed_incident_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_routes_lookup
ON alert_routes(service,severity,enabled);
