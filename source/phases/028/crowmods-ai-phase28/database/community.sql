CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  channel_ref TEXT NOT NULL,
  external_message_id TEXT,
  author_ref TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW'
    CHECK(status IN ('NEW','PROCESSED','ESCALATED','IGNORED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_reply_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  confidence NUMERIC(5,4),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(status IN ('DRAFT','APPROVED','REJECTED','PUBLISHED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','RESOLVED','DISMISSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS community_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_status
ON community_messages(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_escalations_status
ON community_escalations(status,created_at DESC);
