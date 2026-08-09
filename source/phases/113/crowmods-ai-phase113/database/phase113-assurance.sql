CREATE TABLE IF NOT EXISTS kms_verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  key_reference TEXT NOT NULL,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  verification_status TEXT NOT NULL
    CHECK(verification_status IN ('VERIFIED','FAILED','BLOCKED')),
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_test_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID REFERENCES security_controls(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('SCHEDULED','RUNNING','SUCCEEDED','FAILED','SKIPPED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_risk_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID REFERENCES security_controls(id) ON DELETE CASCADE,
  likelihood NUMERIC(6,3) NOT NULL,
  impact NUMERIC(6,3) NOT NULL,
  exposure NUMERIC(6,3) NOT NULL,
  effectiveness NUMERIC(7,3) NOT NULL,
  priority_score NUMERIC(10,3) NOT NULL,
  priority TEXT NOT NULL
    CHECK(priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assurance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score NUMERIC(7,3) NOT NULL,
  evidence_score NUMERIC(7,3) NOT NULL,
  control_score NUMERIC(7,3) NOT NULL,
  governance_score NUMERIC(7,3) NOT NULL,
  reliability_score NUMERIC(7,3) NOT NULL,
  risk_score NUMERIC(7,3) NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('STRONG','WATCH','WEAK','INSUFFICIENT_DATA')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kms_verification_time
ON kms_verification_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_control_test_jobs_schedule
ON control_test_jobs(scheduled_for,status);

CREATE INDEX IF NOT EXISTS idx_control_risk_priority
ON control_risk_priorities(priority,priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_assurance_scores_time
ON assurance_scores(created_at DESC);
