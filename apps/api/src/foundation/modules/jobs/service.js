const { getRepository } = require("../../db");

async function enqueue({ type, payload = {}, priority = 0, maxAttempts = 3 }) {
  const repo = getRepository();
  return repo.createJob({ type, status: "QUEUED", priority, maxAttempts, payload });
}

async function processNext() {
  const repo = getRepository();
  const queued = await repo.listJobs({ status: "QUEUED" });
  if (!queued.length) return null;
  const job = queued[0];
  await repo.updateJob(job.id, { status: "PROCESSING", started_at: new Date().toISOString(), attempts: job.attempts + 1 });
  return repo.findJobById(job.id);
}

async function complete(id, error = null) {
  const repo = getRepository();
  const job = await repo.findJobById(id);
  if (!job) {
    const err = new Error("Job not found");
    err.status = 404;
    throw err;
  }
  if (error) {
    const attempts = job.attempts;
    const failed = attempts >= job.max_attempts;
    return repo.updateJob(id, { status: failed ? "FAILED" : "QUEUED", error });
  }
  return repo.updateJob(id, { status: "COMPLETED", completed_at: new Date().toISOString() });
}

async function fail(id, error) {
  const repo = getRepository();
  return repo.updateJob(id, { status: "FAILED", error, completed_at: new Date().toISOString() });
}

async function list({ type, status, limit, offset }) {
  const repo = getRepository();
  return repo.listJobs({ type, status, limit, offset });
}

async function get(id) {
  const repo = getRepository();
  const job = await repo.findJobById(id);
  if (!job) {
    const err = new Error("Job not found");
    err.status = 404;
    throw err;
  }
  return job;
}

module.exports = { enqueue, processNext, complete, fail, list, get };