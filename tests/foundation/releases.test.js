const test = require("node:test");
const assert = require("node:assert/strict");
const { freshRepo, createAdmin, loginToken, authHeaders } = require("./helpers");
const { startServer, stopServer } = require("./server");
const { makeTestApk } = require("./fixtures");

let server;
test.before(async () => { server = await startServer(); });
test.after(async () => { await stopServer(server); });

test.beforeEach(() => freshRepo());

async function createValidatedUpload(token) {
  const fd = new FormData();
  fd.append("file", new Blob([makeTestApk()], { type: "application/vnd.android.package-archive" }), "app.apk");
  const res = await fetch(`${server.base}/api/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });
  const { upload } = await res.json();
  await fetch(`${server.base}/api/admin/uploads/${upload.id}/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  return upload;
}

async function createRelease(token, uploadId) {
  const res = await fetch(`${server.base}/api/admin/releases`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name: "CrowTest App", uploadId, description: "Test release" })
  });
  assert.equal(res.status, 201);
  return (await res.json()).release;
}

test("release can be created from a validated upload", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  assert.equal(release.status, "DRAFT");
  assert.equal(release.version, "1.2.3");
  assert.equal(release.package_name, "com.crowmods.testapp");
  assert.ok(release.slug);
});

test("release cannot be created from an invalid upload", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  await repo.updateUpload(upload.id, { status: "FAILED" });
  const res = await fetch(`${server.base}/api/admin/releases`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name: "X", uploadId: upload.id })
  });
  assert.equal(res.status, 409);
});

test("release cannot skip DRAFT->READY_FOR_REVIEW", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}/approve`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ reason: "" })
  });
  assert.equal(res.status, 409);
});

test("release requires a valid transition through the state machine", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);

  const ready = await fetch(`${server.base}/api/admin/releases/${release.id}/ready`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal((await ready.json()).release.status, "READY_FOR_REVIEW");

  const approve = await fetch(`${server.base}/api/admin/releases/${release.id}/approve`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ reason: "Looks good" })
  });
  assert.equal((await approve.json()).release.status, "APPROVED");
});

test("rejection requires a reason", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  await fetch(`${server.base}/api/admin/releases/${release.id}/ready`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }
  });
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}/reject`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({})
  });
  assert.equal(res.status, 400);
});

test("rejected release stores approval audit event", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  await fetch(`${server.base}/api/admin/releases/${release.id}/ready`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }
  });
  await fetch(`${server.base}/api/admin/releases/${release.id}/reject`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ reason: "Missing changelog" })
  });
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  const approvals = await repo.listApprovalsByRelease(release.id);
  assert.equal(approvals[0].action, "REJECTED");
  assert.equal(approvals[0].reason, "Missing changelog");
  const logs = await repo.listAuditLogs();
  assert.ok(logs.some(l => l.action === "RELEASE_REJECTED"));
});

test("draft release can be archived", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}/archive`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal((await res.json()).release.status, "ARCHIVED");
});

test("releases are listed", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  await createRelease(token, upload.id);
  const res = await fetch(`${server.base}/api/admin/releases`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.releases.length, 1);
});

test("release detail includes versions, upload, scans, jobs", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  assert.equal(body.release.id, release.id);
  assert.ok(body.versions.length >= 1);
  assert.ok(body.upload);
  assert.ok(body.scans.length >= 1);
});

test("request-changes moves a release back for revision", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  await fetch(`${server.base}/api/admin/releases/${release.id}/ready`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }
  });
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}/request-changes`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ reason: "Fix the changelog" })
  });
  assert.equal((await res.json()).release.status, "CHANGES_REQUESTED");
});

test("request-changes requires a reason", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  await fetch(`${server.base}/api/admin/releases/${release.id}/ready`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }
  });
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}/request-changes`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({})
  });
  assert.equal(res.status, 400);
});

test("draft release can be deleted", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal((await res.json()).ok, true);
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  assert.equal(await repo.findReleaseById(release.id), null);
});

test("only draft releases can be deleted", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  await fetch(`${server.base}/api/admin/releases/${release.id}/ready`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }
  });
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 409);
});