CREATE TABLE IF NOT EXISTS identity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  provider TEXT NOT NULL,
  roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  authenticated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS slo_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  fast_burn_threshold DOUBLE PRECISION NOT NULL,
  slow_burn_threshold DOUBLE PRECISION NOT NULL,
  severity TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slo_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES slo_alert_rules(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  fast_burn DOUBLE PRECISION NOT NULL,
  slow_burn DOUBLE PRECISION NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS immutable_audit_log (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  allowed BOOLEAN NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_hash TEXT,
  event_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_subject
ON identity_sessions(subject,enabled);

CREATE INDEX IF NOT EXISTS idx_slo_alert_rule_time
ON slo_alert_events(rule_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_immutable_audit_time
ON immutable_audit_log(created_at DESC);
