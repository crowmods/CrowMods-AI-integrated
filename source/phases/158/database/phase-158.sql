CREATE TABLE IF NOT EXISTS phase_158_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  state TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phase_158_audit_time
ON phase_158_audit(created_at DESC);
