CREATE TABLE IF NOT EXISTS identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  email_hash TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('ACTIVE','SUSPENDED','REVOKED')),
  mfa_required BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider,provider_subject)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  ip_hash TEXT,
  user_agent_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  permission TEXT NOT NULL,
  UNIQUE(role_name,permission)
);

CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  request_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_identity
ON sessions(identity_id,expires_at);

CREATE INDEX IF NOT EXISTS idx_security_events_time
ON security_events(created_at DESC);

INSERT INTO role_permissions(role_name,permission) VALUES
 ('OWNER','*'),
 ('ADMIN','dashboard.read'),
 ('ADMIN','operations.write'),
 ('ADMIN','users.manage'),
 ('ADMIN','connectors.manage'),
 ('ADMIN','financials.read'),
 ('EDITOR','releases.write'),
 ('EDITOR','media.write'),
 ('EDITOR','campaigns.write'),
 ('EDITOR','knowledge.write'),
 ('SUPPORT','support.write'),
 ('SUPPORT','community.moderate'),
 ('SUPPORT','subscriptions.read'),
 ('ANALYST','analytics.read'),
 ('ANALYST','revenue.read')
ON CONFLICT DO NOTHING;
