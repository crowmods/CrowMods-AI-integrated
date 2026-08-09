CREATE TABLE IF NOT EXISTS alert_cap_windows (
  alert_key TEXT PRIMARY KEY,
  escalation_count INTEGER NOT NULL DEFAULT 0,
  cap INTEGER NOT NULL DEFAULT 3,
  reset_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_binding_cas (
  model_key TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  fencing_version BIGINT NOT NULL,
  checkpoint_version BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manifest_replay_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  export_id UUID NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('NEW','REPLAY','CONFLICT','FAILED')),
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_cap_reset
ON alert_cap_windows(reset_at);

CREATE INDEX IF NOT EXISTS idx_calibration_binding_cas
ON calibration_binding_cas(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_manifest_replay_audit
ON manifest_replay_audit(idempotency_key,created_at DESC);
