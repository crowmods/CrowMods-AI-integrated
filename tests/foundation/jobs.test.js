const test = require("node:test");
const assert = require("node:assert/strict");
const { freshRepo } = require("./helpers");
const jobs = require("../../apps/api/src/foundation/modules/jobs/service");

test.beforeEach(() => freshRepo());

test("enqueue creates a queued job", async () => {
  const job = await jobs.enqueue({ type: "metadata", payload: { id: 1 } });
  assert.equal(job.status, "QUEUED");
  assert.equal(job.type, "metadata");
  assert.equal(job.attempts, 0);
});

test("processNext picks and marks a job processing", async () => {
  await jobs.enqueue({ type: "scan" });
  const job = await jobs.processNext();
  assert.ok(job);
  assert.equal(job.status, "PROCESSING");
  assert.equal(job.attempts, 1);
});

test("complete marks a job completed", async () => {
  const created = await jobs.enqueue({ type: "scan" });
  await jobs.processNext();
  const done = await jobs.complete(created.id);
  assert.equal(done.status, "COMPLETED");
  assert.ok(done.completed_at);
});

test("fail marks a job failed and records error", async () => {
  const created = await jobs.enqueue({ type: "scan" });
  const failed = await jobs.fail(created.id, "boom");
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.error, "boom");
});

test("processNext returns null when queue empty", async () => {
  const job = await jobs.processNext();
  assert.equal(job, null);
});

test("retried failed jobs eventually fail after max attempts", async () => {
  const created = await jobs.enqueue({ type: "scan", maxAttempts: 2 });
  const repo = require("../../apps/api/src/foundation/db").getRepository();
  await repo.updateJob(created.id, { attempts: 2 });
  const done = await jobs.complete(created.id, "persistent error");
  assert.equal(done.status, "FAILED");
});