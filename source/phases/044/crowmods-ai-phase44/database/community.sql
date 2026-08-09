CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  external_message_ref TEXT,
  member_ref TEXT,
  channel_ref TEXT,
  message_text TEXT,
  message_type TEXT NOT NULL DEFAULT 'UNKNOWN',
  ai_label TEXT,
  risk_score NUMERIC(5,4),
  suggested_action TEXT,
  status TEXT NOT NULL DEFAULT 'RECEIVED'
    CHECK(status IN ('RECEIVED','REVIEW','ANSWERED','ESCALATED','IGNORED','RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','APPROVED','EXECUTED','REJECTED','FAILED')),
  actor_ref TEXT,
  external_action_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  external_member_ref TEXT NOT NULL,
  display_name TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(platform,external_member_ref)
);

CREATE TABLE IF NOT EXISTS community_events (
  id BIGSERIAL PRIMARY KEY,
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_review
ON community_messages(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_messages_member
ON community_messages(platform,member_ref,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_actions_status
ON community_actions(status,created_at DESC);
