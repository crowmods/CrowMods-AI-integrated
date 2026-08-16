const test = require("node:test");
const assert = require("node:assert/strict");
const { freshRepo, createAdmin, loginToken, authHeaders } = require("./helpers");
const { startServer, stopServer } = require("./server");

let server;
test.before(async () => { server = await startServer(); });
test.after(async () => { await stopServer(server); });

test.beforeEach(() => freshRepo());

test("audit logs record admin actions and can be listed", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await fetch(`${server.base}/api/admin/audit-logs`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.logs.some(l => l.action === "ADMIN_LOGIN"));
});

test("audit logs are filterable by action", async () => {
  const { email, password } = await createAdmin();
  await loginToken(server, email, password);
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  await repo.createAuditLog({ actorId: null, action: "SETTING_CHANGED", resource: "settings" });
  const logs = await repo.listAuditLogs({ action: "SETTING_CHANGED" });
  assert.equal(logs.length, 1);
  assert.equal(logs[0].action, "SETTING_CHANGED");
});

test("audit events are never logged with secrets", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const audit = require("../../apps/api/src/foundation/modules/audit/service");
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  await audit.log({ actorId: null, action: "SECRET_WRITE", resource: "settings", metadata: { apiKey: "should-not-appear" } });
  const logs = await repo.listAuditLogs();
  const raw = JSON.stringify(logs);
  assert.ok(!raw.includes("ghp_"));
  assert.ok(!raw.includes("should-not-appear"));
});

test("dashboard returns aggregate stats", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await fetch(`${server.base}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(typeof body.totalReleases, "number");
  assert.equal(typeof body.totalUploads, "number");
  assert.ok("pendingApproval" in body);
});

test("analytics returns provider success rates", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await fetch(`${server.base}/api/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok("providerSuccessRate" in body);
  assert.ok("avgJobDurationMs" in body);
});

test("system health reports component statuses", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await fetch(`${server.base}/api/admin/system/health`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  const body = await res.json();
  for (const key of ["api", "database", "storage", "queue", "website", "telegram", "discord"]) {
    assert.ok(["HEALTHY", "DEGRADED", "DOWN", "UNKNOWN"].includes(body[key]), `${key} has valid status`);
  }
});

test("notifications can be created and marked read", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  const admin = await repo.findUserByEmail(email);
  await repo.createNotification({ userId: admin.id, type: "test", severity: "INFO", title: "Hello", message: "World" });
  const res = await fetch(`${server.base}/api/admin/notifications`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  assert.equal(body.notifications.length, 1);
  assert.equal(body.notifications[0].title, "Hello");
  const read = await fetch(`${server.base}/api/admin/notifications/${body.notifications[0].id}/read`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await read.json()).notification.read_at !== null, true);
});

test("customers can be created and listed", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const create = await fetch(`${server.base}/api/admin/customers`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name: "Acme", email: "acme@example.com", planCode: "PRO" })
  });
  assert.equal(create.status, 201);
  const list = await fetch(`${server.base}/api/admin/customers`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await list.json();
  assert.equal(body.customers.length, 1);
  assert.equal(body.customers[0].name, "Acme");
});

test("customer status can be toggled", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  await fetch(`${server.base}/api/admin/customers`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name: "Acme" })
  });
  const list = await (await fetch(`${server.base}/api/admin/customers`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const id = list.customers[0].id;
  const update = await fetch(`${server.base}/api/admin/customers/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status: "SUSPENDED" })
  });
  assert.equal((await update.json()).customer.status, "SUSPENDED");
});

test("plans expose limits", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await fetch(`${server.base}/api/admin/plans`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  assert.equal(body.plans.length, 6);
  const pro = body.plans.find(p => p.code === "PRO");
  assert.equal(pro.limits.maxPublishingTargets, 2);
});

test("entitlements derive from customer plan", async () => {
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  const plans = require("../../apps/api/src/foundation/modules/plans/service");
  const customer = await repo.createCustomer({ name: "Biz", email: "b@b.com", planId: (await repo.findPlanByCode("BUSINESS")).id });
  const entitlements = await plans.entitlements(customer.id);
  assert.equal(entitlements.plan, "BUSINESS");
  assert.equal(entitlements.limits.maxPublishingTargets, 5);
});

test("integrations can connect, test, disconnect", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const connect = await fetch(`${server.base}/api/admin/integrations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ provider: "telegram", name: "TG", config: { botToken: "123:ABC", chatId: "-100" } })
  });
  assert.equal(connect.status, 201);
  const t = await fetch(`${server.base}/api/admin/integrations/telegram/test`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await t.json()).ok, true);
  const list = await (await fetch(`${server.base}/api/admin/integrations`, { headers: { Authorization: `Bearer ${token}` } })).json();
  assert.equal(list.integrations.length, 1);
  const disc = await fetch(`${server.base}/api/admin/integrations/${list.integrations[0].id}/disconnect`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  assert.equal(disc.status, 200);
});