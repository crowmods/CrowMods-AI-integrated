CREATE TABLE IF NOT EXISTS kms_provider_adapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  endpoint TEXT,
  key_reference TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_test_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES control_test_jobs(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL,
  lease_token TEXT NOT NULL UNIQUE,
  leased_until TIMESTAMPTZ NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL
    CHECK(status IN ('ACTIVE','EXPIRED','RELEASED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_test_retries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES control_test_jobs(id) ON DELETE CASCADE,
  attempt INTEGER NOT NULL,
  delay_seconds INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID REFERENCES security_controls(id) ON DELETE CASCADE,
  risk_statement TEXT NOT NULL,
  owner TEXT NOT NULL,
  approved_by TEXT,
  status TEXT NOT NULL
    CHECK(status IN ('REQUESTED','APPROVED','REJECTED','EXPIRED','REVOKED')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assurance_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_score NUMERIC(7,3) NOT NULL,
  slope_per_period NUMERIC(10,4) NOT NULL,
  horizon_periods INTEGER NOT NULL,
  projected_score NUMERIC(7,3),
  forecast_status TEXT NOT NULL
    CHECK(forecast_status IN ('IMPROVING','STABLE','DECLINING','AT_RISK')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_control_test_leases_expiry
ON control_test_leases(leased_until,status);

CREATE INDEX IF NOT EXISTS idx_risk_acceptances_expiry
ON risk_acceptances(expires_at,status);

CREATE INDEX IF NOT EXISTS idx_assurance_forecasts_time
ON assurance_forecasts(created_at DESC);
