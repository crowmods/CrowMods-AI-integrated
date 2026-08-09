CREATE TABLE IF NOT EXISTS worker_lock_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_id UUID REFERENCES worker_locks(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  new_expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS dlq_replay_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dead_letter_id UUID REFERENCES dead_letter_jobs(id) ON DELETE CASCADE,
  replayed_by TEXT NOT NULL,
  replay_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL
    CHECK(status IN ('REQUESTED','REPLAYED','BLOCKED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dlq_quarantine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dead_letter_id UUID REFERENCES dead_letter_jobs(id) ON DELETE CASCADE,
  quarantined_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('QUARANTINED','RELEASED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator TEXT NOT NULL,
  delegate TEXT NOT NULL,
  approval_level INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('ACTIVE','EXPIRED','REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS executive_decision_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID REFERENCES executive_risk_register(id) ON DELETE SET NULL,
  decision TEXT NOT NULL,
  rationale TEXT NOT NULL,
  decision_maker TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_trend_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  open_risks INTEGER NOT NULL,
  critical_risks INTEGER NOT NULL,
  average_residual_score NUMERIC(10,3),
  trend TEXT NOT NULL
    CHECK(trend IN ('IMPROVING','STABLE','WORSENING','INSUFFICIENT_DATA')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lock_heartbeats_time
ON worker_lock_heartbeats(heartbeat_at DESC);

CREATE INDEX IF NOT EXISTS idx_dlq_replay_time
ON dlq_replay_attempts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_decision_records_time
ON executive_decision_records(decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_trends_time
ON risk_trend_snapshots(created_at DESC);
