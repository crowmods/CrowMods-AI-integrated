CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  subject TEXT,
  resource TEXT,
  action TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','ACKNOWLEDGED','CLOSED')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  subject TEXT NOT NULL,
  assigned_reviewer TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','COMPLETED','OVERDUE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_a_id UUID NOT NULL,
  policy_b_id UUID NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  conflict_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(policy_a_id,policy_b_id,resource,action)
);

CREATE TABLE IF NOT EXISTS governance_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_type TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_status
ON security_alerts(status,severity,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_assignments_status
ON access_review_assignments(status,due_at);

CREATE INDEX IF NOT EXISTS idx_policy_conflicts_status
ON policy_conflicts(status,severity,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_governance_evidence_time
ON governance_evidence(created_at DESC);
