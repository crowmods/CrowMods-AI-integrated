CREATE TABLE IF NOT EXISTS ai_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNING'
    CHECK(status IN ('PLANNING','WAITING_APPROVAL','RUNNING','VERIFYING','COMPLETED','FAILED','CANCELLED')),
  created_by TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_workflow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES ai_workflows(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK(status IN ('QUEUED','RUNNING','WAITING_APPROVAL','VERIFYING','COMPLETED','FAILED','CANCELLED')),
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_permission TEXT,
  approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by TEXT,
  error_message TEXT,
  sequence_no INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ai_tool_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  permission TEXT NOT NULL,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(agent,tool_name)
);

CREATE TABLE IF NOT EXISTS ai_execution_events (
  id BIGSERIAL PRIMARY KEY,
  workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
  task_id UUID REFERENCES ai_workflow_tasks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ai_tool_permissions(agent,tool_name,permission,requires_approval) VALUES
 ('Content','knowledge.search','knowledge.read',FALSE),
 ('Content','campaign.draft','campaigns.write',FALSE),
 ('Release','release.create','releases.write',TRUE),
 ('Release','release.publish','releases.write',TRUE),
 ('Campaign','campaign.create','campaigns.write',TRUE),
 ('Campaign','campaign.publish','campaigns.write',TRUE),
 ('Community','support.draft','support.write',FALSE),
 ('Community','moderation.action','community.moderate',TRUE),
 ('Analytics','analytics.read','analytics.read',FALSE),
 ('Revenue','revenue.read','revenue.read',FALSE),
 ('Revenue','price.change','financials.write',TRUE),
 ('Security','security.read','dashboard.read',FALSE)
ON CONFLICT(agent,tool_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_ai_workflows_status
ON ai_workflows(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_workflow_tasks_queue
ON ai_workflow_tasks(status,sequence_no,created_at);

CREATE INDEX IF NOT EXISTS idx_ai_execution_events
ON ai_execution_events(workflow_id,created_at DESC);
