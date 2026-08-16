const { getRepository } = require("../../db");

async function list() {
  const repo = getRepository();
  return repo.listPlans();
}

async function getByCode(code) {
  const repo = getRepository();
  const plan = await repo.findPlanByCode(code);
  if (!plan) {
    const err = new Error("Plan not found");
    err.status = 404;
    throw err;
  }
  return plan;
}

async function entitlements(customerId) {
  const repo = getRepository();
  const customer = customerId ? await repo.findCustomerById(customerId) : null;
  let plan = customer?.plan_id ? await repo.findPlanById(customer.plan_id) : await repo.findPlanByCode("FREE");
  if (!plan) plan = await repo.findPlanByCode("FREE");
  const [uploads, releases, jobs] = await Promise.all([
    repo.listUploads({ limit: 100000 }),
    repo.listReleases({ limit: 100000 }),
    repo.listJobs({ limit: 100000 })
  ]);
  const limits = { ...plan.limits };
  return {
    plan: plan.code,
    limits,
    usage: {
      uploads: uploads.length,
      releases: releases.length,
      jobs: jobs.length
    }
  };
}

module.exports = { list, getByCode, entitlements };