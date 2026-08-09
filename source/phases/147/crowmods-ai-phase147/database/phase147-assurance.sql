CREATE TABLE IF NOT EXISTS repair_redrive_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('REDRIVE','REJECT')),
  target_attempt INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slo_burn_rate_severity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_class TEXT NOT NULL,
  window_minutes INTEGER NOT NULL,
  burn_rate NUMERIC(12,5) NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('NORMAL','ELEVATED','HIGH','CRITICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lease_conflict_baselines (
  model_key TEXT PRIMARY KEY,
  baseline_rate NUMERIC(12,6) NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lease_conflict_trend_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  observed_rate NUMERIC(12,6) NOT NULL,
  baseline_rate NUMERIC(12,6) NOT NULL,
  delta_ratio NUMERIC(12,6) NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('NORMAL','ELEVATED','SPIKE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quarantine_evidence_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarantine_id UUID NOT NULL,
  previous_hash TEXT,
  evidence_hash TEXT NOT NULL,
  chain_hash TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redrive_time
ON repair_redrive_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_burn_severity_time
ON slo_burn_rate_severity(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lease_trend_time
ON lease_conflict_trend_samples(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_chain
ON quarantine_evidence_chain(quarantine_id,created_at);
