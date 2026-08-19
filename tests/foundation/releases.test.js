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

async function publishedPublicRelease(token) {
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  for (const action of ["ready", "approve", "publish"]) {
    const res = await fetch(`${server.base}/api/admin/releases/${release.id}/${action}`, {
      method: "POST",
      headers: action === "publish" ? { ...authHeaders(token), "Content-Type": "application/json" } : authHeaders(token),
      body: action === "publish" ? JSON.stringify({ provider: "website" }) : undefined
    });
    assert.equal(res.status, 200);
  }
  const patch = await fetch(`${server.base}/api/admin/releases/${release.id}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ visibility: "PUBLIC" })
  });
  assert.equal(patch.status, 200);
  return (await patch.json()).release;
}

test("published public release can be downloaded", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const release = await publishedPublicRelease(token);
  const res = await fetch(`${server.base}/releases/${release.slug}/download`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-disposition"), "attachment; filename=\"app.apk\"");
  const body = await res.arrayBuffer();
  assert.equal(body.byteLength, makeTestApk().length);
});

test("private releases cannot be downloaded", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const upload = await createValidatedUpload(token);
  const release = await createRelease(token, upload.id);
  await fetch(`${server.base}/api/admin/releases/${release.id}/ready`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }
  });
  await fetch(`${server.base}/api/admin/releases/${release.id}/approve`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }
  });
  await fetch(`${server.base}/api/admin/releases/${release.id}/publish`, {
    method: "POST", headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "website" })
  });
  const res = await fetch(`${server.base}/releases/${release.slug}/download`);
  assert.equal(res.status, 404);
});

test("public page download button points to the artifact endpoint", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const release = await publishedPublicRelease(token);
  const page = await (await fetch(`${server.base}/releases/${release.slug}`)).text();
  assert.ok(page.includes(`/releases/${release.slug}/download`));
});

test("public page uses custom domain when website integration is configured", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const save = await fetch(`${server.base}/api/admin/integrations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ provider: "website", name: "Public Site", config: { publicDomain: "https://mods.example.com", adminPanelUrl: "https://panel.example.com/admin" } })
  });
  assert.equal(save.status, 201);
  const release = await publishedPublicRelease(token);
  const page = await (await fetch(`${server.base}/releases/${release.slug}`)).text();
  assert.ok(page.includes(`https://mods.example.com/releases/${release.slug}`), "absolute download URL");
  assert.ok(page.includes(`https://mods.example.com/releases/${release.slug}/download`), "absolute download href");
  assert.ok(page.includes(`<link rel="canonical" href="https://mods.example.com/releases/${release.slug}"/>`), "canonical link");
  assert.ok(page.includes(`href="https://panel.example.com/admin"`), "admin panel link");
  assert.ok(page.includes(`content="https://mods.example.com/releases/${release.slug}"`), "og:url");
});

test("website integration upserts instead of duplicating", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  for (const i of [1, 2]) {
    const res = await fetch(`${server.base}/api/admin/integrations`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ provider: "website", name: "Public Site", config: { publicDomain: "https://mods.example.com" } })
    });
    assert.equal(res.status, 201);
  }
  const list = await (await fetch(`${server.base}/api/admin/integrations`, { headers: authHeaders(token) })).json();
  assert.equal(list.integrations.filter(i => i.provider === "website").length, 1);
});

test("website integration rejects invalid custom domain URL", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await fetch(`${server.base}/api/admin/integrations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ provider: "website", name: "Public Site", config: { publicDomain: "not-a-url" } })
  });
  assert.equal(res.status, 400);
});

test("public index lists published releases with admin link", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  await fetch(`${server.base}/api/admin/integrations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ provider: "website", name: "Public Site", config: { adminPanelUrl: "https://panel.example.com/admin" } })
  });
  const release = await publishedPublicRelease(token);
  const index = await (await fetch(`${server.base}/releases`)).text();
  assert.ok(index.includes(`<a class="card" href="/releases/${release.slug}">`), "release card on index");
  assert.ok(index.includes(`href="https://panel.example.com/admin"`), "admin link on index");
});

test("public index uses custom domain absolute URLs", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  await fetch(`${server.base}/api/admin/integrations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ provider: "website", name: "Public Site", config: { publicDomain: "https://mods.example.com" } })
  });
  const release = await publishedPublicRelease(token);
  const index = await (await fetch(`${server.base}/releases`)).text();
  assert.ok(index.includes(`https://mods.example.com/releases/${release.slug}`), "absolute card URL");
});

test("sitemap lists published releases and robots.txt allows crawl", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const release = await publishedPublicRelease(token);
  const sitemap = await (await fetch(`${server.base}/sitemap.xml`)).text();
  assert.ok(sitemap.includes(`<loc>/releases/${release.slug}</loc>`), "sitemap entry");
  const robots = await (await fetch(`${server.base}/robots.txt`)).text();
  assert.ok(robots.includes("Allow: /"), "robots allows crawl");
  const og = await fetch(`${server.base}/og-logo.png`);
  assert.equal(og.status, 200);
  assert.match(og.headers.get("content-type"), /image\/png/);
});

test("missing public release returns HTML 404", async () => {
  const res = await fetch(`${server.base}/releases/does-not-exist`);
  assert.equal(res.status, 404);
  assert.match(res.headers.get("content-type"), /text\/html/);
  assert.ok((await res.text()).includes("404"));
});