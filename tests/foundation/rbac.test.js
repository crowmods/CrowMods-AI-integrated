const test = require("node:test");
const assert = require("node:assert/strict");
const { freshRepo, createAdmin, loginToken, authHeaders } = require("./helpers");
const { startServer, stopServer } = require("./server");

let server;
test.before(async () => { server = await startServer(); });
test.after(async () => { await stopServer(server); });

test.beforeEach(() => freshRepo());

async function createOperator(adminToken) {
  const res = await fetch(`${server.base}/api/admin/users`, {
    method: "POST",
    headers: authHeaders(adminToken),
    body: JSON.stringify({ email: "op@crowmods.test", name: "Operator", password: "SecurePass123", role: "OPERATOR" })
  });
  const body = await res.json();
  return body.user;
}

test("OPERATOR cannot approve releases", async () => {
  const { email, password } = await createAdmin();
  const adminToken = await loginToken(server, email, password);
  await createOperator(adminToken);

  const login = await fetch(`${server.base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "op@crowmods.test", password: "SecurePass123" })
  });
  const opToken = (await login.json()).token;

  const res = await fetch(`${server.base}/api/admin/releases/anything/approve`, {
    method: "POST",
    headers: authHeaders(opToken),
    body: JSON.stringify({})
  });
  assert.equal(res.status, 403);
});

test("admin can update another user's role and email", async () => {
  const { email, password } = await createAdmin();
  const adminToken = await loginToken(server, email, password);
  const op = await createOperator(adminToken);

  const res = await fetch(`${server.base}/api/admin/users/${op.id}`, {
    method: "PATCH",
    headers: authHeaders(adminToken),
    body: JSON.stringify({ role: "SUPPORT", email: "op2@crowmods.test", name: "Operator Two" })
  });
  assert.equal(res.status, 200);
  const { user } = await res.json();
  assert.equal(user.role, "SUPPORT");
  assert.equal(user.email, "op2@crowmods.test");
  assert.equal(user.name, "Operator Two");
});

test("clearing a user's name is allowed (empty string, not null)", async () => {
  const { email, password } = await createAdmin();
  const adminToken = await loginToken(server, email, password);
  const op = await createOperator(adminToken);

  const res = await fetch(`${server.base}/api/admin/users/${op.id}`, {
    method: "PATCH",
    headers: authHeaders(adminToken),
    body: JSON.stringify({ name: "" })
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).user.name, "");
});

test("a super admin can demote another super admin while one remains", async () => {
  const { email, password } = await createAdmin();
  const adminToken = await loginToken(server, email, password);
  const second = await (await fetch(`${server.base}/api/admin/users`, {
    method: "POST",
    headers: authHeaders(adminToken),
    body: JSON.stringify({ email: "sa2@crowmods.test", name: "Second SA", password: "SecurePass123", role: "SUPER_ADMIN" })
  })).json();
  assert.equal(second.user.role, "SUPER_ADMIN");

  const res = await fetch(`${server.base}/api/admin/users/${second.user.id}`, {
    method: "PATCH",
    headers: authHeaders(adminToken),
    body: JSON.stringify({ role: "ADMIN" })
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).user.role, "ADMIN");
});

test("cannot change your own role or deactivate yourself", async () => {
  const { email, password } = await createAdmin();
  const adminToken = await loginToken(server, email, password);
  const me = await (await fetch(`${server.base}/api/admin/users`, { headers: authHeaders(adminToken) })).json();
  const myId = me.users.find(u => u.email === email).id;

  const res = await fetch(`${server.base}/api/admin/users/${myId}`, {
    method: "PATCH",
    headers: authHeaders(adminToken),
    body: JSON.stringify({ role: "VIEWER" })
  });
  assert.equal(res.status, 400);
  const res2 = await fetch(`${server.base}/api/admin/users/${myId}`, {
    method: "DELETE",
    headers: authHeaders(adminToken)
  });
  assert.equal(res2.status, 400);
});

test("cannot assign a duplicate email", async () => {
  const { email, password } = await createAdmin();
  const adminToken = await loginToken(server, email, password);
  const op = await createOperator(adminToken);

  const res = await fetch(`${server.base}/api/admin/users/${op.id}`, {
    method: "PATCH",
    headers: authHeaders(adminToken),
    body: JSON.stringify({ email })
  });
  assert.equal(res.status, 409);
});

test("deactivating a user revokes their login", async () => {
  const { email, password } = await createAdmin();
  const adminToken = await loginToken(server, email, password);
  const op = await createOperator(adminToken);

  const del = await fetch(`${server.base}/api/admin/users/${op.id}`, {
    method: "DELETE",
    headers: authHeaders(adminToken)
  });
  assert.equal(del.status, 200);
  assert.equal((await del.json()).user.status, "INACTIVE");

  const login = await fetch(`${server.base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "op@crowmods.test", password: "SecurePass123" })
  });
  assert.equal(login.status, 403);
});

test("OPERATOR can create uploads", async () => {
  const { email, password } = await createAdmin();
  const adminToken = await loginToken(server, email, password);
  await createOperator(adminToken);

  const login = await fetch(`${server.base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "op@crowmods.test", password: "SecurePass123" })
  });
  const opToken = (await login.json()).token;

  const res = await fetch(`${server.base}/api/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${opToken}` },
    body: new Blob([])
  });
  assert.equal(res.status, 400);
});

test("VIEWER cannot modify anything but can read", async () => {
  const { email, password } = await createAdmin();
  const adminToken = await loginToken(server, email, password);
  await fetch(`${server.base}/api/admin/users`, {
    method: "POST",
    headers: authHeaders(adminToken),
    body: JSON.stringify({ email: "view@crowmods.test", name: "Viewer", password: "SecurePass123", role: "VIEWER" })
  });

  const login = await fetch(`${server.base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "view@crowmods.test", password: "SecurePass123" })
  });
  const viewToken = (await login.json()).token;

  const read = await fetch(`${server.base}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${viewToken}` } });
  assert.equal(read.status, 200);

  const create = await fetch(`${server.base}/api/admin/releases`, {
    method: "POST",
    headers: authHeaders(viewToken),
    body: JSON.stringify({ name: "x" })
  });
  assert.equal(create.status, 403);
});

test("SUPER_ADMIN has full access", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await fetch(`${server.base}/api/admin/audit-logs`, { headers: authHeaders(token) });
  assert.equal(res.status, 200);
});

test("roles are seeded with correct permissions", async () => {
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  const roles = await repo.rolesWithPermissions();
  const superAdmin = roles.find(r => r.name === "SUPER_ADMIN");
  assert.ok(superAdmin);
  assert.ok(superAdmin.permissions.includes("release.approve"));
  assert.ok(superAdmin.permissions.includes("settings.update"));

  const operator = roles.find(r => r.name === "OPERATOR");
  assert.ok(!operator.permissions.includes("release.approve"));
  assert.ok(operator.permissions.includes("upload.create"));
});