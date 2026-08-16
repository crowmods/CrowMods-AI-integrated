const test = require("node:test");
const assert = require("node:assert/strict");
const { freshRepo, createAdmin, loginToken, authHeaders } = require("./helpers");
const { startServer, stopServer } = require("./server");

let server;
test.before(async () => { server = await startServer(); });
test.after(async () => { await stopServer(server); });

test.beforeEach(() => freshRepo());

test("health endpoint", async () => {
  const res = await fetch(`${server.base}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.service, "crowmods-ai-foundation");
});

test("login with correct credentials returns token and user", async () => {
  const { email, password } = await createAdmin();
  const res = await fetch(`${server.base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.token);
  assert.equal(body.user.email, email);
  assert.equal(body.user.role, "SUPER_ADMIN");
});

test("login with wrong password returns 401", async () => {
  const { email } = await createAdmin();
  const res = await fetch(`${server.base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "wrong" })
  });
  assert.equal(res.status, 401);
});

test("unauthenticated admin routes return 401", async () => {
  const res = await fetch(`${server.base}/api/admin/dashboard`);
  assert.equal(res.status, 401);
});

test("me returns authenticated user", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await fetch(`${server.base}/api/admin/auth/me`, { headers: authHeaders(token) });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user.email, email);
});

test("logout revokes the session token", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const logout = await fetch(`${server.base}/api/admin/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(logout.status, 200);
  const me = await fetch(`${server.base}/api/admin/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(me.status, 401);
});

test("login rate limiting blocks after too many attempts", async () => {
  const { email } = await createAdmin();
  let lastStatus = 0;
  for (let i = 0; i < 22; i++) {
    const res = await fetch(`${server.base}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "wrong" })
    });
    lastStatus = res.status;
  }
  assert.equal(lastStatus, 429);
});

test("admin login is recorded in audit log", async () => {
  const { email, password } = await createAdmin();
  await loginToken(server, email, password);
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  const logs = await repo.listAuditLogs();
  assert.ok(logs.some(l => l.action === "ADMIN_LOGIN"));
});

test("creating a new admin user", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await fetch(`${server.base}/api/admin/users`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ email: "operator@crowmods.test", name: "Op", password: "SecurePass123", role: "OPERATOR" })
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.user.role, "OPERATOR");
});

test("password reset request returns a token and can reset the password", async () => {
  const { email, password } = await createAdmin();
  const req = await fetch(`${server.base}/api/admin/auth/password-reset/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  assert.equal(req.status, 200);
  const { token } = await req.json();
  assert.ok(token);

  const confirm = await fetch(`${server.base}/api/admin/auth/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password: "BrandNewPassw0rd" })
  });
  assert.equal(confirm.status, 200);

  const loginOld = await fetch(`${server.base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  assert.equal(loginOld.status, 401);

  const loginNew = await fetch(`${server.base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "BrandNewPassw0rd" })
  });
  assert.equal(loginNew.status, 200);
});

test("password reset token cannot be reused", async () => {
  const { email } = await createAdmin();
  const req = await fetch(`${server.base}/api/admin/auth/password-reset/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const { token } = await req.json();
  await fetch(`${server.base}/api/admin/auth/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password: "BrandNewPassw0rd" })
  });
  const second = await fetch(`${server.base}/api/admin/auth/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password: "AnotherPassw0rd" })
  });
  assert.equal(second.status, 400);
});

test("password reset request is rate limited", async () => {
  const { email } = await createAdmin();
  const { passwordResetLimiter } = require("../../apps/api/src/foundation/routes/admin.routes");
  for (let i = 0; i < 11; i++) {
    const res = await fetch(`${server.base}/api/admin/auth/password-reset/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (i < 10) assert.equal(res.status, 200);
    else assert.equal(res.status, 429);
  }
  if (passwordResetLimiter && typeof passwordResetLimiter.resetKey === "function") {
    await passwordResetLimiter.resetKey("::ffff:127.0.0.1");
  }
});