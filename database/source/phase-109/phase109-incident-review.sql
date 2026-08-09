CREATE TABLE IF NOT EXISTS incident_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES reliability_incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_time TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  reference_key TEXT,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deployment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_key TEXT NOT NULL UNIQUE,
  service TEXT NOT NULL,
  environment TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL
    CHECK(status IN ('STARTED','SUCCEEDED','FAILED','ROLLED_BACK')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recovery_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES recovery_workflows(id) ON DELETE CASCADE,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  key_version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  evidence JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_incident_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES reliability_incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL
    CHECK(status IN ('DRAFT','IN_REVIEW','APPROVED','CLOSED')),
  summary TEXT NOT NULL,
  root_cause TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_incident_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES post_incident_reviews(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  owner TEXT NOT NULL,
  priority TEXT NOT NULL
    CHECK(priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','IN_PROGRESS','DONE','ACCEPTED_RISK')),
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_timeline_time
ON incident_timeline_events(event_time DESC);

CREATE INDEX IF NOT EXISTS idx_deployment_events_time
ON deployment_events(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_evidence_time
ON recovery_evidence(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_incident_reviews_time
ON post_incident_reviews(updated_at DESC);
