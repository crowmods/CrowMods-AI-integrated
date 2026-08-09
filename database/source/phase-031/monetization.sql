CREATE TABLE IF NOT EXISTS monetization_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_minor BIGINT NOT NULL CHECK(price_minor >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  interval TEXT NOT NULL DEFAULT 'month'
    CHECK(interval IN ('one_time','month','year')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_customer_ref TEXT UNIQUE,
  email_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES monetization_plans(id),
  external_subscription_ref TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','ACTIVE','PAST_DUE','CANCELLED','EXPIRED')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  amount_minor BIGINT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_events (
  id BIGSERIAL PRIMARY KEY,
  partner_ref TEXT NOT NULL,
  click_ref TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK(event_type IN ('CLICK','CONVERSION')),
  value_minor BIGINT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_time
ON payment_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_affiliate_events_time
ON affiliate_events(created_at DESC);
