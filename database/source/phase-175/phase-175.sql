CREATE TABLE IF NOT EXISTS phase_175_iam_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phase_175_iam_audit_time
ON phase_175_iam_audit(created_at DESC);
