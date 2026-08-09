CREATE TABLE IF NOT EXISTS purge_row_binding_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_key TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('PURGED','SKIPPED','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_cap_state_machine (
  alert_key TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK(state IN ('NORMAL','WARNING','CRITICAL','CAPPED','RECOVERING')),
  escalation_count INTEGER NOT NULL DEFAULT 0,
  cap INTEGER NOT NULL DEFAULT 3,
  healthy_cycles INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_atomic_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  fencing_version BIGINT NOT NULL,
  old_checkpoint_version BIGINT NOT NULL,
  new_checkpoint_version BIGINT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('COMMITTED','CONFLICT','DENIED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manifest_replay_cache (
  idempotency_key TEXT PRIMARY KEY,
  export_id UUID NOT NULL,
  response_json JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purge_binding_audit
ON purge_row_binding_audit(run_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_cap_state
ON alert_cap_state_machine(state,reset_at);

CREATE INDEX IF NOT EXISTS idx_calibration_atomic_time
ON calibration_atomic_commits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manifest_replay_expiry
ON manifest_replay_cache(expires_at);
