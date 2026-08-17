const test = require("node:test");
const assert = require("node:assert/strict");
const { PostgresRepository } = require("../../apps/api/src/foundation/db/postgres");

const url = process.env.PG_TEST_URL;
const skip = !url ? "Set PG_TEST_URL to a Postgres connection string to run Postgres repository tests" : false;

let repo = null;

test.before(async () => {
  if (!url) return;
  repo = new PostgresRepository(url);
  await repo.migrate();
});

test.after(async () => {
  if (repo) await repo.close();
});

test("Postgres repository: migrations + RBAC + users + sessions", { skip }, async () => {
  const roles = await repo.rolesWithPermissions();
  assert.ok(roles.length >= 3, "roles seeded");
  assert.equal(await repo.hasPermission("SUPER_ADMIN", "anything"), true);
  assert.equal(await repo.hasPermission("VIEWER", "admin.users.create"), false);

  const user = await repo.createUser({ email: "pg@test.dev", name: "PG User", passwordHash: "h", role: "ADMIN" });
  assert.ok(user.id);
  assert.equal((await repo.findUserByEmail("PG@TEST.DEV")).id, user.id);
  const upd = await repo.updateUser(user.id, { name: "Renamed" });
  assert.equal(upd.name, "Renamed");
  assert.ok(upd.updated_at);

  const sess = await repo.createSession({ userId: user.id, tokenHash: "t1", expiresAt: new Date(Date.now() + 60000), ip: "1.2.3.4", userAgent: "test" });
  assert.equal((await repo.findSessionByToken("t1")).id, sess.id);
  await repo.revokeSession(sess.id);
  assert.ok((await repo.findSessionByToken("t1")).revoked_at);

  const pr = await repo.createPasswordReset({ userId: user.id, tokenHash: "pr1", expiresAt: new Date(Date.now() + 60000) });
  await repo.markPasswordResetUsed(pr.id);
  assert.ok((await repo.findPasswordResetByToken("pr1")).used_at);

  await repo.createSession({ userId: user.id, tokenHash: "t2", expiresAt: new Date(Date.now() + 60000) });
  await repo.revokeUserSessions(user.id);
  assert.ok((await repo.findSessionByToken("t2")).revoked_at);
});

test("Postgres repository: plans + customers", { skip }, async () => {
  const plans = await repo.listPlans();
  assert.ok(plans.length >= 5, "plans seeded");
  const pro = await repo.findPlanByCode("PRO");
  assert.ok(pro.id && pro.limits.maxReleases > 0);
  const cust = await repo.createCustomer({ name: "Acme", email: "a@b.co", status: "ACTIVE", planId: pro.id });
  assert.equal((await repo.findCustomerById(cust.id)).name, "Acme");
  assert.equal((await repo.listCustomers({ search: "acme" })).length, 1);
  await repo.updateCustomer(cust.id, { status: "SUSPENDED" });
  assert.equal((await repo.findCustomerById(cust.id)).status, "SUSPENDED");
  assert.equal(await repo.countCustomers(), 1);
});

test("Postgres repository: uploads + scans", { skip }, async () => {
  const user = await repo.createUser({ email: "pg2@test.dev", name: "U2", passwordHash: "h", role: "ADMIN" });
  const up = await repo.createUpload({ customerId: null, userId: user.id, originalFilename: "app.apk", internalFilename: "i", mimeType: "application/vnd.android.package-archive", extension: "apk", sizeBytes: 123, sha256: "abc", storagePath: "/s" });
  assert.equal(Number((await repo.findUploadById(up.id)).size_bytes), 123);
  await repo.updateUpload(up.id, { status: "VALIDATED", metadata: { version: "1.0" } });
  assert.equal((await repo.findUploadById(up.id)).metadata.version, "1.0");
  await repo.createScan({ uploadId: up.id, scanner: "static", version: "1", status: "CLEAN", findings: [{ sig: "x" }] });
  assert.equal((await repo.listScansByUpload(up.id)).length, 1);
  assert.equal((await repo.countUploadsByStatus()).VALIDATED, 1);
});

test("Postgres repository: releases default description/version when absent", { skip }, async () => {
  const user = await repo.createUser({ email: "pg3@test.dev", name: "U3", passwordHash: "h", role: "ADMIN" });
  const rel = await repo.createRelease({ customerId: null, uploadId: null, name: "NoDesc", slug: "nodesc", description: undefined, version: undefined, versionCode: 1, packageName: "com.x", status: "DRAFT", visibility: "PRIVATE", createdBy: user.id });
  assert.equal(rel.description, "");
  assert.equal(rel.version, "");
  assert.equal((await repo.findReleaseBySlug("nodesc")).name, "NoDesc");
  await repo.updateRelease(rel.id, { status: "READY", visibility: "PUBLIC" });
  assert.equal((await repo.findReleaseById(rel.id)).visibility, "PUBLIC");
  const rv = await repo.createReleaseVersion({ releaseId: rel.id, version: "1.0", versionCode: 1, uploadId: null, changelog: undefined, createdBy: user.id });
  assert.equal(rv.changelog, "");
  await repo.createApproval({ releaseId: rel.id, action: "APPROVE", actorId: user.id, reason: "ok" });
  assert.equal((await repo.listApprovalsByRelease(rel.id)).length, 1);
  assert.equal((await repo.countReleasesByStatus()).READY, 1);
});

test("Postgres repository: integrations + publishing + jobs + notifications + audit", { skip }, async () => {
  const user = await repo.createUser({ email: "pg4@test.dev", name: "U4", passwordHash: "h", role: "ADMIN" });
  const rel = await repo.createRelease({ customerId: null, uploadId: null, name: "R", slug: "r-", description: "d", version: "1", status: "DRAFT", createdBy: user.id });

  const int = await repo.createIntegration({ provider: "telegram", name: "TG", status: "CONNECTED", config: { token: "t" } });
  assert.equal(int.config.token, "t");
  await repo.updateIntegration(int.id, { status: "DISCONNECTED" });
  assert.equal((await repo.findIntegrationById(int.id)).status, "DISCONNECTED");

  const pj = await repo.createPublishingJob({ releaseId: rel.id, provider: "website", status: "QUEUED", idempotencyKey: "k1", payload: { p: 1 } });
  assert.equal((await repo.findPublishingJobByKey("k1")).id, pj.id);
  await repo.updatePublishingJob(pj.id, { status: "SUCCESS", result: { ok: true } });
  assert.equal((await repo.findPublishingJobById(pj.id)).result.ok, true);
  await repo.createPublishingResult({ jobId: pj.id, provider: "website", status: "SUCCESS", externalId: "e1", metadata: { m: 1 } });
  assert.equal((await repo.listPublishingResults(pj.id))[0].external_id, "e1");
  assert.equal((await repo.countPublishingJobsByStatus()).SUCCESS, 1);

  const job = await repo.createJob({ type: "test", status: "QUEUED", payload: { x: 2 } });
  await repo.updateJob(job.id, { status: "COMPLETED" });
  assert.equal((await repo.findJobById(job.id)).status, "COMPLETED");

  const note = await repo.createNotification({ userId: user.id, type: "info", severity: "INFO", title: "Hi", data: { d: 1 } });
  assert.equal(note.data.d, 1);
  await repo.markNotificationRead(note.id);
  assert.equal((await repo.listNotifications({ userId: user.id, unreadOnly: true })).length, 0);

  await repo.createAuditLog({ actorId: user.id, actorEmail: "pg4@test.dev", action: "TEST", resource: "user", resourceId: user.id, metadata: { m: 1 } });
  assert.equal((await repo.listAuditLogs({ action: "TEST" })).length, 1);
  assert.equal(await repo.countAuditLogs(), 1);
});