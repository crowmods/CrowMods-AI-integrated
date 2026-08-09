CREATE TABLE IF NOT EXISTS redrive_approval_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key TEXT NOT NULL UNIQUE,
  required_approvals INTEGER NOT NULL DEFAULT 1,
  max_redrives INTEGER NOT NULL DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS redrive_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL,
  policy_key TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('APPROVED','REJECTED')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replay_safeguard_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  export_id UUID NOT NULL,
  safeguard_state TEXT NOT NULL CHECK(
    safeguard_state IN ('ALLOW','REPLAY','CONFLICT','BLOCKED')
  ),
  payload_hash TEXT,
  manifest_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS burn_rate_hysteresis_state (
  alert_class TEXT PRIMARY KEY,
  severity TEXT NOT NULL CHECK(
    severity IN ('NORMAL','ELEVATED','HIGH','CRITICAL')
  ),
  breach_cycles INTEGER NOT NULL DEFAULT 0,
  recovery_cycles INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adaptive_lease_baselines (
  model_key TEXT PRIMARY KEY,
  baseline_rate NUMERIC(12,6) NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  alpha NUMERIC(8,6) NOT NULL DEFAULT 0.20,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_chain_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarantine_id UUID NOT NULL,
  chain_head_hash TEXT NOT NULL,
  anchor_hash TEXT NOT NULL,
  anchor_version BIGINT NOT NULL,
  anchored_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS closure_verification_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarantine_id UUID NOT NULL,
  valid BOOLEAN NOT NULL,
  chain_length INTEGER NOT NULL,
  head_hash TEXT,
  report_hash TEXT NOT NULL,
  verified_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redrive_approval_time
ON redrive_approval_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_replay_safeguard_time
ON replay_safeguard_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_anchor_quarantine
ON evidence_chain_anchors(quarantine_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_closure_report_time
ON closure_verification_reports(created_at DESC);
