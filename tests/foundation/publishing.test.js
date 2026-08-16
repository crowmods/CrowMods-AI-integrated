const test = require("node:test");
const assert = require("node:assert/strict");
const { freshRepo, createAdmin, loginToken, authHeaders } = require("./helpers");
const { startServer, stopServer } = require("./server");
const { makeTestApk } = require("./fixtures");

let server;
test.before(async () => { server = await startServer(); });
test.after(async () => { await stopServer(server); });

test.beforeEach(() => freshRepo());

async function approvedRelease(token) {
  const fd = new FormData();
  fd.append("file", new Blob([makeTestApk()], { type: "application/vnd.android.package-archive" }), "app.apk");
  const up = await (await fetch(`${server.base}/api/admin/uploads`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd })).json();
  await fetch(`${server.base}/api/admin/uploads/${up.upload.id}/validate`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  const rel = await (await fetch(`${server.base}/api/admin/releases`, { method: "POST", headers: authHeaders(token), body: JSON.stringify({ name: "Pub App", uploadId: up.upload.id }) })).json();
  await fetch(`${server.base}/api/admin/releases/${rel.release.id}/ready`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  await fetch(`${server.base}/api/admin/releases/${rel.release.id}/approve`, { method: "POST", headers: authHeaders(token), body: JSON.stringify({ reason: "Approved" }) });
  return rel.release;
}

test("publishing requires an approved release", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const fd = new FormData();
  fd.append("file", new Blob([makeTestApk()], { type: "application/vnd.android.package-archive" }), "app.apk");
  const up = await (await fetch(`${server.base}/api/admin/uploads`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd })).json();
  await fetch(`${server.base}/api/admin/uploads/${up.upload.id}/validate`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  const rel = await (await fetch(`${server.base}/api/admin/releases`, { method: "POST", headers: authHeaders(token), body: JSON.stringify({ name: "Draft App", uploadId: up.upload.id }) })).json();
  const res = await fetch(`${server.base}/api/admin/releases/${rel.release.id}/publish`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ providers: ["website"] })
  });
  assert.equal(res.status, 409);
});

test("website publishing job completes and marks release published", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const release = await approvedRelease(token);
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}/publish`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ providers: ["website"] })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.jobs.length, 1);
  assert.equal(body.jobs[0].provider, "website");
  assert.equal(body.jobs[0].status, "SUCCESS");
  assert.ok(body.jobs[0].result.externalId);
  assert.equal(body.jobs[0].result.provider, "website");
});

test("idempotency: publishing twice returns the same job", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const release = await approvedRelease(token);
  const opts = { method: "POST", headers: authHeaders(token), body: JSON.stringify({ providers: ["telegram"] }) };
  const first = await (await fetch(`${server.base}/api/admin/releases/${release.id}/publish`, opts)).json();
  const second = await (await fetch(`${server.base}/api/admin/releases/${release.id}/publish`, opts)).json();
  assert.equal(first.jobs[0].id, second.jobs[0].id);
});

test("telegram and discord mock publishing succeeds with recorded results", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const release = await approvedRelease(token);
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}/publish`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ providers: ["telegram", "discord"] })
  });
  const body = await res.json();
  assert.equal(body.jobs.length, 2);
  for (const job of body.jobs) {
    assert.equal(job.status, "SUCCESS");
    assert.ok(job.result.externalId);
  }
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  const results = await repo.listPublishingJobs({ releaseId: release.id });
  assert.equal(results.length, 2);
});

test("retry on failed job", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const release = await approvedRelease(token);
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  const job = await repo.createPublishingJob({ releaseId: release.id, provider: "website", status: "FAILED", idempotencyKey: `pub:website:${release.id}` });
  const res = await fetch(`${server.base}/api/admin/publishing/${job.id}/retry`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await res.json()).job.status, "QUEUED");
});

test("release preview contains website html and provider messages", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const release = await approvedRelease(token);
  const res = await fetch(`${server.base}/api/admin/releases/${release.id}/preview`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.website.includes("<!doctype html>"));
  assert.ok(body.website.includes(release.name));
  assert.ok(body.telegram.message);
  assert.ok(body.discord.payload);
});

test("publishing jobs are listed with status", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const release = await approvedRelease(token);
  await fetch(`${server.base}/api/admin/releases/${release.id}/publish`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ providers: ["website"] })
  });
  const res = await fetch(`${server.base}/api/admin/publishing/jobs`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  assert.equal(body.jobs.length, 1);
  assert.equal(body.jobs[0].status, "SUCCESS");
});