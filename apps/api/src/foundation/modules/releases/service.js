const { getRepository } = require("../../db");

const VALID_STATUSES = new Set([
  "DRAFT", "PROCESSING", "READY_FOR_REVIEW", "APPROVED", "REJECTED",
  "CHANGES_REQUESTED", "PUBLISHING", "PUBLISHED", "FAILED", "ARCHIVED"
]);

const TRANSITIONS = {
  DRAFT: ["PROCESSING", "READY_FOR_REVIEW", "ARCHIVED"],
  PROCESSING: ["READY_FOR_REVIEW", "FAILED", "ARCHIVED"],
  READY_FOR_REVIEW: ["APPROVED", "REJECTED", "CHANGES_REQUESTED", "ARCHIVED"],
  CHANGES_REQUESTED: ["READY_FOR_REVIEW", "ARCHIVED"],
  APPROVED: ["PUBLISHING", "ARCHIVED"],
  REJECTED: ["READY_FOR_REVIEW", "ARCHIVED"],
  PUBLISHING: ["PUBLISHED", "FAILED"],
  PUBLISHED: ["ARCHIVED"],
  FAILED: ["READY_FOR_REVIEW", "ARCHIVED"],
  ARCHIVED: []
};

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "release";
}

async function ensureUniqueSlug(base, excludeId) {
  const repo = getRepository();
  let slug = slugify(base);
  let candidate = slug;
  let n = 2;
  while (await repo.findReleaseBySlug(candidate)) {
    const existing = await repo.findReleaseBySlug(candidate);
    if (excludeId && existing && existing.id === excludeId) break;
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}

async function create({ customerId, uploadId, name, description, version, versionCode, packageName, visibility, createdBy, ip, changelog = "" }) {
  const repo = getRepository();
  if (uploadId) {
    const upload = await repo.findUploadById(uploadId);
    if (!upload) {
      const err = new Error("Upload not found");
      err.status = 404;
      throw err;
    }
    if (upload.status !== "VALID") {
      const err = new Error("Upload must be valid before creating a release.");
      err.status = 409;
      throw err;
    }
    packageName = packageName || upload.metadata?.package || null;
    version = version || upload.metadata?.versionName || "";
    versionCode = versionCode ?? upload.metadata?.versionCode ?? null;
  }
  const slug = await ensureUniqueSlug(name);
  const release = await repo.createRelease({
    customerId, uploadId, name, slug, description, version, versionCode, packageName,
    status: "DRAFT", visibility: visibility || "PRIVATE", createdBy
  });
  await repo.createReleaseVersion({
    releaseId: release.id, version: version || "0.0.0", versionCode,
    uploadId, changelog, createdBy,
    metadata: { note: "Initial version" }
  });
  await repo.createAuditLog({
    actorId: createdBy, action: "RELEASE_CREATED", resource: "release",
    resourceId: release.id, ip, metadata: { slug: release.slug }
  });
  await repo.createNotification({
    userId: createdBy, type: "release.created", severity: "INFO",
    title: "Release created", message: `${release.name} was created.`
  });
  return release;
}

async function list({ limit, offset, status, customerId, search }) {
  const repo = getRepository();
  return repo.listReleases({ limit, offset, status, customerId, search });
}

async function get(id) {
  const repo = getRepository();
  const release = await repo.findReleaseById(id);
  if (!release) {
    const err = new Error("Release not found");
    err.status = 404;
    throw err;
  }
  return release;
}

async function getBySlug(slug) {
  const repo = getRepository();
  const release = await repo.findReleaseBySlug(slug);
  if (!release) {
    const err = new Error("Release not found");
    err.status = 404;
    throw err;
  }
  return release;
}

async function detail(id) {
  const repo = getRepository();
  const release = await get(id);
  const [versions, approvals, upload, jobs, scans] = await Promise.all([
    repo.listReleaseVersions(id),
    repo.listApprovalsByRelease(id),
    release.upload_id ? repo.findUploadById(release.upload_id) : Promise.resolve(null),
    repo.listPublishingJobs({ releaseId: id }),
    release.upload_id ? repo.listScansByUpload(release.upload_id) : Promise.resolve([])
  ]);
  return { release, versions, approvals, upload, jobs, scans };
}

async function update(id, fields, actorId, ip) {
  const repo = getRepository();
  const release = await get(id);
  const allowed = ["name", "description", "version", "versionCode", "packageName", "visibility", "changelog"];
  const next = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      const dbKey = key === "versionCode" ? "version_code" : key === "packageName" ? "package_name" : key;
      next[dbKey] = fields[key];
    }
  }
  if (next.slug !== undefined) delete next.slug;
  if (next.name) next.slug = await ensureUniqueSlug(next.name, id);
  const updated = await repo.updateRelease(id, next);
  await repo.createAuditLog({
    actorId, action: "RELEASE_UPDATED", resource: "release", resourceId: id, ip,
    metadata: { fields: Object.keys(next) }
  });
  return updated;
}

function assertTransition(from, to) {
  const allowed = TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    const err = new Error(`Invalid status transition ${from} -> ${to}`);
    err.code = "INVALID_TRANSITION";
    err.status = 409;
    throw err;
  }
}

async function transition(id, to, actorId, ip, reason, actionLabel) {
  const repo = getRepository();
  const release = await get(id);
  assertTransition(release.status, to);
  const updated = await repo.updateRelease(id, { status: to });
  if (actionLabel) {
    await repo.createAuditLog({
      actorId, action: actionLabel, resource: "release", resourceId: id, ip,
      metadata: { from: release.status, to, reason }
    });
  }
  return updated;
}

async function markReady(id, actorId, ip) {
  const release = await transition(id, "READY_FOR_REVIEW", actorId, ip, "", "RELEASE_READY");
  const repo = getRepository();
  await repo.createNotification({
    userId: actorId, type: "release.ready", severity: "INFO",
    title: "Release ready for review", message: `${release.name} awaits approval.`
  });
  return release;
}

async function approve(id, actorId, ip, reason = "") {
  const repo = getRepository();
  const release = await transition(id, "APPROVED", actorId, ip, reason, "RELEASE_APPROVED");
  await repo.createApproval({ releaseId: id, action: "APPROVED", actorId, reason });
  await repo.createAuditLog({
    actorId, action: "RELEASE_APPROVED", resource: "release", resourceId: id, ip, result: "SUCCESS"
  });
  return release;
}

async function reject(id, actorId, ip, reason = "") {
  if (!reason || !reason.trim()) {
    const err = new Error("A reason is required to reject a release.");
    err.status = 400;
    throw err;
  }
  const repo = getRepository();
  const release = await transition(id, "REJECTED", actorId, ip, reason, "RELEASE_REJECTED");
  await repo.createApproval({ releaseId: id, action: "REJECTED", actorId, reason });
  await repo.createNotification({
    userId: actorId, type: "release.rejected", severity: "WARNING",
    title: "Release rejected", message: `${release.name} was rejected.`
  });
  return release;
}

async function requestChanges(id, actorId, ip, reason = "") {
  if (!reason || !reason.trim()) {
    const err = new Error("A reason is required to request changes.");
    err.status = 400;
    throw err;
  }
  const repo = getRepository();
  const release = await transition(id, "CHANGES_REQUESTED", actorId, ip, reason, "RELEASE_CHANGES_REQUESTED");
  await repo.createApproval({ releaseId: id, action: "REQUEST_CHANGES", actorId, reason });
  return release;
}

async function archive(id, actorId, ip) {
  const repo = getRepository();
  const release = await get(id);
  if (release.status === "ARCHIVED") return release;
  return transition(id, "ARCHIVED", actorId, ip, "", "RELEASE_ARCHIVED");
}

async function removeDraft(id, actorId, ip) {
  const repo = getRepository();
  const release = await get(id);
  if (release.status !== "DRAFT") {
    const err = new Error("Only draft releases can be deleted.");
    err.status = 409;
    throw err;
  }
  await repo.deleteRelease(id);
  await repo.createAuditLog({
    actorId, action: "RELEASE_DELETED", resource: "release", resourceId: id, ip
  });
  return { ok: true };
}

module.exports = {
  create, list, get, getBySlug, detail, update, markReady, approve, reject,
  requestChanges, archive, removeDraft, transition, slugify, TRANSITIONS, VALID_STATUSES
};