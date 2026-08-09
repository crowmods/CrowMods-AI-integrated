CREATE TABLE IF NOT EXISTS repair_execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL,
  worker_id TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('REPAIRED','RETRY','FAILED','REJECTED')),
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slo_burn_rate_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_class TEXT NOT NULL,
  window_minutes INTEGER NOT NULL,
  compliance_ratio NUMERIC(8,5) NOT NULL,
  burn_rate NUMERIC(12,5) NOT NULL,
  threshold NUMERIC(12,5) NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('NORMAL','BREACH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lease_conflict_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  owner_id TEXT,
  fencing_version BIGINT,
  conflict_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quarantine_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarantine_id UUID NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  evidence_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_execution_time
ON repair_execution_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_burn_rate_time
ON slo_burn_rate_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lease_conflict_model
ON lease_conflict_analytics(model_key,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quarantine_state
ON quarantine_state_history(quarantine_id,created_at DESC);
