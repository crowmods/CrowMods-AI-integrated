CREATE TABLE IF NOT EXISTS phase_220_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phase_220_audit_time
ON phase_220_audit(created_at DESC);
