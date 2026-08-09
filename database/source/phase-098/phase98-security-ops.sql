CREATE TABLE IF NOT EXISTS security_alert_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  analyst TEXT NOT NULL,
  decision TEXT NOT NULL
    CHECK(decision IN ('ACKNOWLEDGED','FALSE_POSITIVE','ESCALATED','CLOSED')),
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS privileged_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  session_type TEXT NOT NULL,
  source_ip TEXT,
  resource_scope TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('ACTIVE','ENDED','SUSPENDED'))
);

CREATE TABLE IF NOT EXISTS privileged_session_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  resource TEXT,
  action TEXT,
  outcome TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signed_evidence_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_type TEXT NOT NULL,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  key_version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_triage_alert
ON security_alert_triage(alert_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_privileged_sessions_status
ON privileged_sessions(status,started_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_events_time
ON privileged_session_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signed_evidence_time
ON signed_evidence_bundles(created_at DESC);
