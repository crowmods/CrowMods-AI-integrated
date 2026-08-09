CREATE TABLE IF NOT EXISTS phase_259_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phase_259_audit_time
ON phase_259_audit(created_at DESC);
