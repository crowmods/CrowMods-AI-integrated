#!/usr/bin/env node
/**
 * Restore/rotate the admin password against a running CrowMods API.
 *
 * The in-memory repository re-bootstraps `admin@crowmods.test` with a random
 * password on every cold start (when ADMIN_EMAIL/ADMIN_PASSWORD are unset).
 * This script uses the public password-reset flow to set a known password so
 * you can log in again without reading Render logs.
 *
 * Env (all optional):
 *   CROWMODS_BASE_URL     default https://crowmods-ai-integrated.onrender.com
 *   CROWMODS_ADMIN_EMAIL  default admin@crowmods.test
 *   CROWMODS_ADMIN_PASSWORD default admin123 (the password to set)
 *
 * Usage: node scripts/reset-admin.js
 */
const base = process.env.CROWMODS_BASE_URL || "https://crowmods-ai-integrated.onrender.com";
const email = process.env.CROWMODS_ADMIN_EMAIL || "admin@crowmods.test";
const password = process.env.CROWMODS_ADMIN_PASSWORD || "admin123";

async function main() {
  if (password.length < 8) {
    console.error("ERROR: password must be at least 8 characters.");
    process.exit(1);
  }
  const req = await fetch(`${base}/api/admin/auth/password-reset/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  if (!req.ok) {
    console.error(`ERROR: reset request failed (HTTP ${req.status}) — is the API up?`);
    process.exit(1);
  }
  const { token } = await req.json();
  if (!token) {
    console.error("ERROR: no reset token returned (account may not exist).");
    process.exit(1);
  }
  const conf = await fetch(`${base}/api/admin/auth/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, password })
  });
  if (!conf.ok) {
    console.error(`ERROR: password reset failed (HTTP ${conf.status}).`);
    process.exit(1);
  }
  const login = await fetch(`${base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (login.ok) {
    console.log(`OK: admin password is now "${password}" for ${email} at ${base}`);
  } else {
    console.error(`WARNING: password set but login check failed (HTTP ${login.status}).`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});