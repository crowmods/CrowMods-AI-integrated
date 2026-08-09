CREATE TABLE IF NOT EXISTS authorization_policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  policy_state JSONB NOT NULL,
  created_by TEXT NOT NULL,
  change_reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(policy_id,version_number)
);

CREATE TABLE IF NOT EXISTS privileged_change_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID NOT NULL,
  approver TEXT NOT NULL,
  approval_type TEXT NOT NULL,
  decision TEXT NOT NULL
    CHECK(decision IN ('APPROVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_review_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL UNIQUE,
  resource_scope TEXT NOT NULL,
  reviewer_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','CLOSED')),
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES access_review_campaigns(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  decision TEXT NOT NULL
    CHECK(decision IN ('RETAIN','REVOKE','FLAG')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS governance_audit (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT NOT NULL,
  operation TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_versions_policy
ON authorization_policy_versions(policy_id,version_number DESC);

CREATE INDEX IF NOT EXISTS idx_access_reviews_campaign
ON access_review_decisions(campaign_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_governance_audit_time
ON governance_audit(created_at DESC);
