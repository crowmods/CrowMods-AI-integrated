CREATE TABLE IF NOT EXISTS slo_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  target_availability DOUBLE PRECISION NOT NULL,
  window_minutes INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slo_observations (
  id BIGSERIAL PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES slo_policies(id) ON DELETE CASCADE,
  good_events BIGINT NOT NULL,
  total_events BIGINT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_timeline (
  id BIGSERIAL PRIMARY KEY,
  incident_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operational_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operator_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_name TEXT NOT NULL UNIQUE,
  role_id UUID NOT NULL REFERENCES operational_roles(id),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operational_audit (
  id BIGSERIAL PRIMARY KEY,
  operator_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  allowed BOOLEAN NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slo_observations_policy_time
ON slo_observations(policy_id,observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_timeline_incident_time
ON incident_timeline(incident_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operational_audit_operator_time
ON operational_audit(operator_name,created_at DESC);
