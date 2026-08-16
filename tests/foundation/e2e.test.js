const test = require("node:test");
const assert = require("node:assert/strict");
const { freshRepo, createAdmin, loginToken, authHeaders } = require("./helpers");
const { startServer, stopServer } = require("./server");
const { makeTestApk } = require("./fixtures");

let server;
test.before(async () => { server = await startServer(); });
test.after(async () => { await stopServer(server); });

test.beforeEach(() => freshRepo());

test("end-to-end foundation workflow", async () => {
  const { email, password } = await createAdmin();

  const login = await fetch(`${server.base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const headers = authHeaders(token);

  const dashboard0 = await (await fetch(`${server.base}/api/admin/dashboard`, { headers })).json();
  assert.equal(dashboard0.totalReleases, 0);

  const fd = new FormData();
  fd.append("file", new Blob([makeTestApk()], { type: "application/vnd.android.package-archive" }), "e2e-app.apk");
  const uploadRes = await fetch(`${server.base}/api/admin/uploads`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd
  });
  assert.equal(uploadRes.status, 201);
  const { upload } = await uploadRes.json();
  assert.equal(upload.status, "UPLOADED");
  assert.ok(upload.sha256);

  const validateRes = await fetch(`${server.base}/api/admin/uploads/${upload.id}/validate`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(validateRes.status, 200);
  const validated = await validateRes.json();
  assert.equal(validated.upload.status, "VALID");
  assert.equal(validated.upload.metadata.package, "com.crowmods.testapp");
  assert.ok(validated.scan);

  const relRes = await fetch(`${server.base}/api/admin/releases`, {
    method: "POST", headers, body: JSON.stringify({
      name: "CrowMods E2E App", uploadId: upload.id, description: "End-to-end foundation verification", visibility: "PUBLIC"
    })
  });
  assert.equal(relRes.status, 201);
  const { release } = await relRes.json();
  assert.equal(release.status, "DRAFT");

  const ready = await fetch(`${server.base}/api/admin/releases/${release.id}/ready`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal((await ready.json()).release.status, "READY_FOR_REVIEW");

  const approve = await fetch(`${server.base}/api/admin/releases/${release.id}/approve`, {
    method: "POST", headers, body: JSON.stringify({ reason: "E2E approval" })
  });
  assert.equal((await approve.json()).release.status, "APPROVED");

  const preview = await fetch(`${server.base}/api/admin/releases/${release.id}/preview`, { headers });
  assert.equal(preview.status, 200);
  const previewBody = await preview.json();
  assert.ok(previewBody.website.includes("<!doctype html>"));
  assert.ok(previewBody.telegram.message.includes(release.name));
  assert.ok(previewBody.discord.payload);

  const publish = await fetch(`${server.base}/api/admin/releases/${release.id}/publish`, {
    method: "POST", headers, body: JSON.stringify({ providers: ["website", "telegram", "discord"] })
  });
  assert.equal(publish.status, 200);
  const { jobs } = await publish.json();
  assert.equal(jobs.length, 3);
  const providers = jobs.map(j => j.provider).sort();
  assert.deepEqual(providers, ["discord", "telegram", "website"]);
  for (const job of jobs) {
    assert.equal(job.status, "SUCCESS", `${job.provider} succeeded`);
    assert.ok(job.result.externalId);
  }

  const detail = await fetch(`${server.base}/api/admin/releases/${release.id}`, { headers });
  const detailBody = await detail.json();
  assert.equal(detailBody.release.status, "PUBLISHED");
  assert.ok(detailBody.release.published_at);
  assert.equal(detailBody.jobs.length, 3);
  assert.ok(detailBody.versions.length >= 1);
  assert.ok(detailBody.upload);
  assert.ok(detailBody.scans.length >= 1);

  const repo = require("../../apps/api/src/foundation/db").getRepository();
  const publishingJobs = await repo.listPublishingJobs({ releaseId: release.id });
  assert.equal(publishingJobs.length, 3);

  const auditLogs = await repo.listAuditLogs();
  const actions = auditLogs.map(l => l.action);
  for (const expected of ["ADMIN_LOGIN", "UPLOAD_CREATED", "UPLOAD_VALIDATED", "RELEASE_CREATED", "RELEASE_READY", "RELEASE_APPROVED", "RELEASE_PUBLISHED", "PUBLISHING_JOB_CREATED"]) {
    assert.ok(actions.includes(expected), `audit log contains ${expected}`);
  }

  const publishingResults = await repo.listPublishingJobs({ releaseId: release.id });
  assert.equal(publishingResults.every(j => j.status === "SUCCESS"), true);

  const analytics = await (await fetch(`${server.base}/api/admin/analytics`, { headers })).json();
  assert.equal(analytics.published, 1);
  assert.equal(analytics.approved >= 1, true);

  const dashboard = await (await fetch(`${server.base}/api/admin/dashboard`, { headers })).json();
  assert.equal(dashboard.totalReleases, 1);
  assert.equal(dashboard.published, 1);
  assert.equal(dashboard.totalUploads, 1);

  const health = await (await fetch(`${server.base}/api/admin/system/health`, { headers })).json();
  assert.equal(health.api, "HEALTHY");

  const jobList = await fetch(`${server.base}/api/admin/publishing/jobs`, { headers });
  assert.equal((await jobList.json()).jobs.length, 3);

  const dupPublish = await fetch(`${server.base}/api/admin/releases/${release.id}/publish`, {
    method: "POST", headers, body: JSON.stringify({ providers: ["website"] })
  });
  const dupJobs = (await dupPublish.json()).jobs;
  assert.equal(dupJobs[0].id, jobs.find(j => j.provider === "website").id);

  const publicPage = await fetch(`${server.base}/releases/${release.slug}`);
  assert.equal(publicPage.status, 200);
  const pageHtml = await publicPage.text();
  assert.ok(pageHtml.includes("<!doctype html>"));
  assert.ok(pageHtml.includes(release.name));
});