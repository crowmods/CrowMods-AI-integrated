CREATE TABLE IF NOT EXISTS siem_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  subject TEXT,
  resource TEXT,
  action TEXT,
  source TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID,
  escalation_level INTEGER NOT NULL,
  destination TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','SENT','FAILED','CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS privileged_session_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  action TEXT NOT NULL
    CHECK(action IN ('SUSPEND','END')),
  requested_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_export_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_type TEXT NOT NULL,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  key_version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_siem_events_time
ON siem_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_escalations_status
ON security_escalations(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_actions_time
ON privileged_session_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_exports_time
ON evidence_export_bundles(created_at DESC);
