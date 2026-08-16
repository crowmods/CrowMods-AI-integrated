const { getRepository } = require("../../db");

const PROVIDER_MAP = {
  website: require("./website"),
  telegram: require("./telegram"),
  discord: require("./discord")
};

function validateProvider(provider) {
  if (!PROVIDER_MAP[provider]) {
    const err = new Error(`Unknown publishing provider: ${provider}`);
    err.status = 400;
    throw err;
  }
}

async function createJobs(releaseId, providers, actorId, ip) {
  const repo = getRepository();
  const release = await repo.findReleaseById(releaseId);
  if (!release) {
    const err = new Error("Release not found");
    err.status = 404;
    throw err;
  }

  const created = [];
  const missing = [];
  for (const provider of providers) {
    validateProvider(provider);
    const idempotencyKey = `pub:${provider}:${releaseId}`;
    const existing = await repo.findPublishingJobByKey(idempotencyKey);
    if (existing) {
      created.push(existing);
    } else {
      missing.push(provider);
    }
  }
  if (missing.length && release.status !== "APPROVED") {
    const err = new Error("Release must be APPROVED before publishing.");
    err.code = "NOT_APPROVED";
    err.status = 409;
    throw err;
  }
  for (const provider of missing) {
    const job = await repo.createPublishingJob({
      releaseId,
      provider,
      status: "QUEUED",
      priority: 5,
      idempotencyKey: `pub:${provider}:${releaseId}`,
      payload: { releaseId }
    });
    await repo.createAuditLog({
      actorId, action: "PUBLISHING_JOB_CREATED", resource: "publishing_job",
      resourceId: job.id, ip, metadata: { provider, releaseId }
    });
    created.push(job);
  }
  return created;
}

async function processJob(jobId) {
  const repo = getRepository();
  const job = await repo.findPublishingJobById(jobId);
  if (!job) {
    const err = new Error("Publishing job not found");
    err.status = 404;
    throw err;
  }
  if (job.status === "SUCCESS" || job.status === "FAILED" || job.status === "CANCELLED") {
    return job;
  }
  const adapter = PROVIDER_MAP[job.provider];
  await repo.updatePublishingJob(jobId, { status: "PROCESSING", started_at: new Date().toISOString(), attempts: job.attempts + 1 });

  const release = await repo.findReleaseById(job.release_id);
  let upload = null;
  if (release && release.upload_id) upload = await repo.findUploadById(release.upload_id);

  try {
    const result = await adapter.publish(release, upload, job);
    const publishedAt = new Date().toISOString();
    await repo.updatePublishingJob(jobId, {
      status: "SUCCESS", result, completed_at: publishedAt
    });
    await repo.createPublishingResult({
      jobId, provider: job.provider, status: "SUCCESS",
      externalId: result.externalId, publishedAt, metadata: result.metadata || {}
    });
    if (release) {
      await repo.updateRelease(release.id, { status: "PUBLISHED", published_at: publishedAt });
      await repo.createAuditLog({
        action: "RELEASE_PUBLISHED", resource: "release", resourceId: release.id,
        metadata: { provider: job.provider, externalId: result.externalId }
      });
      await repo.createNotification({
        userId: release.created_by, type: "publishing.success", severity: "SUCCESS",
        title: "Published", message: `${release.name} published to ${job.provider}.`
      });
    }
    return await repo.findPublishingJobById(jobId);
  } catch (err) {
    const attempts = job.attempts + 1;
    const failed = attempts >= job.max_attempts;
    await repo.updatePublishingJob(jobId, {
      status: failed ? "FAILED" : "QUEUED", error: err.message
    });
    await repo.createPublishingResult({
      jobId, provider: job.provider, status: "FAILED", error: err.message,
      publishedAt: null
    });
    await repo.createAuditLog({
      action: "PUBLISHING_JOB_FAILED", resource: "publishing_job", resourceId: jobId,
      result: "FAILURE", metadata: { provider: job.provider, error: err.message }
    });
    await repo.createNotification({
      userId: release?.created_by, type: "publishing.failed", severity: "ERROR",
      title: "Publish failed", message: `${release?.name || job.release_id} failed on ${job.provider}.`
    });
    const thrown = new Error(err.message);
    thrown.status = 502;
    throw thrown;
  }
}

async function list({ releaseId, provider, status, limit, offset }) {
  const repo = getRepository();
  return repo.listPublishingJobs({ releaseId, provider, status, limit, offset });
}

async function get(id) {
  const repo = getRepository();
  const job = await repo.findPublishingJobById(id);
  if (!job) {
    const err = new Error("Publishing job not found");
    err.status = 404;
    throw err;
  }
  const results = await repo.listPublishingResults(id);
  return { job, results };
}

async function retry(id, actorId, ip) {
  const repo = getRepository();
  const { job } = await get(id);
  if (job.status !== "FAILED" && job.status !== "CANCELLED") {
    const err = new Error("Only failed or cancelled jobs can be retried.");
    err.status = 409;
    throw err;
  }
  const updated = await repo.updatePublishingJob(id, {
    status: "QUEUED", error: null, attempts: 0
  });
  await repo.createAuditLog({
    actorId, action: "PUBLISHING_JOB_RETRIED", resource: "publishing_job", resourceId: id, ip
  });
  return updated;
}

module.exports = { createJobs, processJob, list, get, retry, validateProvider, PROVIDER_MAP };