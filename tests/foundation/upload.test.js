const test = require("node:test");
const assert = require("node:assert/strict");
const { freshRepo, createAdmin, loginToken, authHeaders } = require("./helpers");
const { startServer, stopServer } = require("./server");
const { makeTestApk, makeZip, makeAndroidManifest } = require("./fixtures");

let server;
test.before(async () => { server = await startServer(); });
test.after(async () => { await stopServer(server); });

test.beforeEach(() => freshRepo());

async function uploadApk(token, buffer, name = "test-app.apk") {
  const fd = new FormData();
  fd.append("file", new Blob([buffer], { type: "application/vnd.android.package-archive" }), name);
  return fetch(`${server.base}/api/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });
}

test("upload a valid APK", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await uploadApk(token, makeTestApk());
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.upload.status, "UPLOADED");
  assert.ok(body.upload.sha256);
  assert.equal(body.upload.original_filename, "test-app.apk");
  assert.notEqual(body.upload.internal_filename, "test-app.apk");
});

test("reject a file with disallowed extension", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const fd = new FormData();
  fd.append("file", new Blob([Buffer.from("hello")], { type: "text/plain" }), "evil.txt");
  const res = await fetch(`${server.base}/api/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.ok(body.message);
});

test("reject non-archive bytes with apk extension", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const fd = new FormData();
  fd.append("file", new Blob([Buffer.from("this is not a zip archive at all")], { type: "application/octet-stream" }), "fake.apk");
  const res = await fetch(`${server.base}/api/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });
  assert.equal(res.status, 500);
});

test("upload without file returns 400", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await fetch(`${server.base}/api/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 400);
});

test("upload creates an audit event", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  await uploadApk(token, makeTestApk());
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  const logs = await repo.listAuditLogs();
  assert.ok(logs.some(l => l.action === "UPLOAD_CREATED"));
});

test("validate upload extracts APK metadata", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await uploadApk(token, makeTestApk({ packageName: "com.crowmods.testapp", versionName: "1.2.3" }));
  const { upload } = await res.json();

  const vres = await fetch(`${server.base}/api/admin/uploads/${upload.id}/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(vres.status, 200);
  const body = await vres.json();
  assert.equal(body.upload.status, "VALID");
  assert.equal(body.upload.metadata.package, "com.crowmods.testapp");
  assert.equal(body.upload.metadata.versionName, "1.2.3");
  assert.equal(body.upload.metadata.manifest.permissions.length, 1);
  assert.ok(body.scan);
  assert.equal(body.scan.status, "CLEAN");
});

test("validate upload extracts metadata from AAB layout", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const aab = makeZip([
    { name: "base/manifest/AndroidManifest.xml", data: makeAndroidManifest({ packageName: "com.crowmods.bundle", versionName: "2.0.0" }) },
    { name: "base/dex/classes.dex", data: Buffer.from("dex\n035\0".padEnd(64, "\0"), "binary") },
    { name: "base/resources.pb", data: Buffer.alloc(16, 1) }
  ]);
  const res = await uploadApk(token, aab, "bundle.aab");
  assert.equal(res.status, 201);
  const { upload } = await res.json();

  const vres = await fetch(`${server.base}/api/admin/uploads/${upload.id}/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(vres.status, 200);
  const body = await vres.json();
  assert.equal(body.upload.status, "VALID");
  assert.equal(body.upload.metadata.package, "com.crowmods.bundle");
  assert.equal(body.upload.metadata.versionName, "2.0.0");
  assert.equal(body.upload.metadata.hasClassesDex, true);
  assert.equal(body.upload.metadata.hasResourcesArsc, true);
});

test("plain zip upload validates with no android manifest", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const zip = makeZip([{ name: "data.txt", data: Buffer.from("hello") }]);
  const res = await uploadApk(token, zip, "archive.zip");
  assert.equal(res.status, 201);
  const { upload } = await res.json();

  const vres = await fetch(`${server.base}/api/admin/uploads/${upload.id}/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(vres.status, 200);
  const body = await vres.json();
  assert.equal(body.upload.status, "VALID");
  assert.equal(body.upload.metadata.package, null);
  assert.equal(body.upload.metadata.manifest, null);
});

test("validate upload extracts metadata from deflate-compressed APK", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const manifest = makeAndroidManifest({ packageName: "com.crowmods.compressed", versionName: "3.0.0" });
  const apk = makeZip([
    { name: "AndroidManifest.xml", data: manifest, method: 8 },
    { name: "classes.dex", data: Buffer.from("dex\n035\0".padEnd(64, "\0"), "binary"), method: 8 },
    { name: "resources.arsc", data: Buffer.alloc(32, 1), method: 8 }
  ]);
  const res = await uploadApk(token, apk, "compressed.apk");
  assert.equal(res.status, 201);
  const { upload } = await res.json();

  const vres = await fetch(`${server.base}/api/admin/uploads/${upload.id}/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(vres.status, 200);
  const body = await vres.json();
  assert.equal(body.upload.status, "VALID");
  assert.equal(body.upload.metadata.package, "com.crowmods.compressed");
  assert.equal(body.upload.metadata.versionName, "3.0.0");
  assert.equal(body.upload.metadata.manifest.permissions.length, 1);
});

test("uploads cannot be validated twice", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await uploadApk(token, makeTestApk());
  const { upload } = await res.json();
  await fetch(`${server.base}/api/admin/uploads/${upload.id}/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  const second = await fetch(`${server.base}/api/admin/uploads/${upload.id}/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(second.status, 409);
});

test("upload can be cancelled (deleted) before use", async () => {
  const { email, password } = await createAdmin();
  const token = await loginToken(server, email, password);
  const res = await uploadApk(token, makeTestApk());
  const { upload } = await res.json();
  assert.ok(upload.storage_path);

  const del = await fetch(`${server.base}/api/admin/uploads/${upload.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(del.status, 200);

  const gone = await fetch(`${server.base}/api/admin/uploads/${upload.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(gone.status, 404);
});