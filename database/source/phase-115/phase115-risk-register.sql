CREATE TABLE IF NOT EXISTS worker_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL,
  lock_token TEXT NOT NULL UNIQUE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('HELD','RELEASED','EXPIRED'))
);

CREATE TABLE IF NOT EXISTS dead_letter_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES control_test_jobs(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL
    CHECK(status IN ('OPEN','REPLAYED','DISCARDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_approval_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_acceptance_id UUID REFERENCES risk_acceptances(id) ON DELETE CASCADE,
  required_level INTEGER NOT NULL,
  current_level INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL
    CHECK(status IN ('PENDING','APPROVED','REJECTED','EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES risk_approval_chains(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  approver TEXT NOT NULL,
  decision TEXT NOT NULL
    CHECK(decision IN ('PENDING','APPROVED','REJECTED')),
  decided_at TIMESTAMPTZ,
  UNIQUE(chain_id,level)
);

CREATE TABLE IF NOT EXISTS executive_risk_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID REFERENCES security_controls(id) ON DELETE SET NULL,
  risk_acceptance_id UUID REFERENCES risk_acceptances(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  risk_statement TEXT NOT NULL,
  likelihood NUMERIC(6,3) NOT NULL,
  impact NUMERIC(6,3) NOT NULL,
  residual_score NUMERIC(10,3) NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('OPEN','MITIGATING','ACCEPTED','CLOSED')),
  review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_locks_expiry
ON worker_locks(expires_at,status);

CREATE INDEX IF NOT EXISTS idx_dead_letter_status
ON dead_letter_jobs(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_register_status
ON executive_risk_register(status,created_at DESC);
