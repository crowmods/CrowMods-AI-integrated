CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  provider_subscription_ref TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'TRIALING'
    CHECK(status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED','CANCELLED','EXPIRED')),
  interval TEXT NOT NULL CHECK(interval IN ('MONTH','YEAR')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  grace_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  provider_invoice_ref TEXT UNIQUE,
  amount_minor BIGINT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('DRAFT','OPEN','PAID','VOID','UNCOLLECTIBLE')),
  hosted_invoice_url TEXT,
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lifecycle_events (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  provider_event_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
ON subscriptions(status,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end
ON subscriptions(current_period_end,status);

CREATE INDEX IF NOT EXISTS idx_invoices_customer
ON invoices(customer_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lifecycle_events_customer
ON lifecycle_events(customer_id,created_at DESC);
