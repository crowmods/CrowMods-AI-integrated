-- Development-only seed.
-- Do not use real credentials or personal data.
INSERT INTO users (email, display_name, role)
VALUES ('owner@example.invalid', 'CrowMods Owner', 'owner')
ON CONFLICT (email) DO NOTHING;
