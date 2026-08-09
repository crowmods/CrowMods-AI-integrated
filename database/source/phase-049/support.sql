CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'WEB',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'GENERAL',
  priority TEXT NOT NULL DEFAULT 'NORMAL'
    CHECK(priority IN ('LOW','NORMAL','HIGH','URGENT')),
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK(status IN ('OPEN','AI_DRAFTED','WAITING_CUSTOMER','ESCALATED','RESOLVED','CLOSED')),
  ai_confidence NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  customer_id UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  telegram_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  discord_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  transactional_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK(status IN ('QUEUED','PROCESSING','SENT','FAILED','CANCELLED')),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_message_ref TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS support_events (
  id BIGSERIAL PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_status
ON support_tickets(status,priority,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_queue
ON notification_queue(status,scheduled_for);

CREATE INDEX IF NOT EXISTS idx_support_events
ON support_events(ticket_id,created_at DESC);
