CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  product_type TEXT NOT NULL
    CHECK(product_type IN ('SUBSCRIPTION','DIGITAL_PRODUCT','SPONSORSHIP','AFFILIATE')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  provider_price_ref TEXT,
  amount_minor BIGINT NOT NULL CHECK(amount_minor >= 0),
  currency CHAR(3) NOT NULL,
  interval TEXT
    CHECK(interval IN ('ONE_TIME','MONTH','YEAR')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_customer_ref TEXT,
  anonymous_ref TEXT,
  email_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_ref TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  provider_customer_ref TEXT,
  provider_payment_ref TEXT,
  amount_minor BIGINT,
  currency CHAR(3),
  status TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  provider_entitlement_ref TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('ACTIVE','PAUSED','EXPIRED','REVOKED')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_events (
  id BIGSERIAL PRIMARY KEY,
  affiliate_ref TEXT NOT NULL,
  click_ref TEXT,
  event_type TEXT NOT NULL
    CHECK(event_type IN ('CLICK','CONVERSION')),
  amount_minor BIGINT,
  currency CHAR(3),
  provider_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_active
ON products(active,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_events_time
ON payment_events(received_at DESC);

CREATE INDEX IF NOT EXISTS idx_entitlements_customer
ON entitlements(customer_id,status);

CREATE INDEX IF NOT EXISTS idx_affiliate_events_ref
ON affiliate_events(affiliate_ref,created_at DESC);
