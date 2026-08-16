const test = require("node:test");
const assert = require("node:assert/strict");
const { MemoryRepository } = require("../../apps/api/src/foundation/db/memory");
const { setRepository } = require("../../apps/api/src/foundation/db");
const auth = require("../../apps/api/src/foundation/modules/auth/service");
const releases = require("../../apps/api/src/foundation/modules/releases/service");

async function freshRepo() {
  setRepository(new MemoryRepository());
  try {
    const { loginLimiter, passwordResetLimiter } = require("../../apps/api/src/foundation/routes/admin.routes");
    for (const limiter of [loginLimiter, passwordResetLimiter]) {
      if (limiter && typeof limiter.resetKey === "function") {
        await limiter.resetKey("::ffff:127.0.0.1");
      }
    }
  } catch {}
  return require("../../apps/api/src/foundation/db").getRepository();
}

async function createAdmin(email = "admin@crowmods.test", password = "Str0ng!Passw0rd") {
  await auth.createInitialAdmin(email, password, "Test Admin");
  return { email, password };
}

async function loginToken(server, email, password) {
  const res = await fetch(`${server.base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  assert.equal(res.status, 200);
  return (await res.json()).token;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

module.exports = { freshRepo, createAdmin, loginToken, authHeaders, auth, releases };