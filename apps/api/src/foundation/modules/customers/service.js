const { getRepository } = require("../../db");

async function create({ name, email, status = "ACTIVE", planCode }) {
  const repo = getRepository();
  let planId = null;
  if (planCode) {
    const plan = await repo.findPlanByCode(planCode);
    if (!plan) {
      const err = new Error(`Unknown plan: ${planCode}`);
      err.status = 400;
      throw err;
    }
    planId = plan.id;
  }
  const customer = await repo.createCustomer({ name, email, status, planId });
  return customer;
}

async function list({ search, status }) {
  const repo = getRepository();
  return repo.listCustomers({ search, status });
}

async function get(id) {
  const repo = getRepository();
  const customer = await repo.findCustomerById(id);
  if (!customer) {
    const err = new Error("Customer not found");
    err.status = 404;
    throw err;
  }
  return customer;
}

async function update(id, fields, actorId, ip) {
  const repo = getRepository();
  await get(id);
  const allowed = ["name", "email", "status", "planId"];
  const next = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      next[key === "planId" ? "plan_id" : key] = fields[key];
    }
  }
  const updated = await repo.updateCustomer(id, next);
  await repo.createAuditLog({
    actorId, action: "CUSTOMER_UPDATED", resource: "customer", resourceId: id, ip,
    metadata: { fields: Object.keys(next) }
  });
  return updated;
}

async function releases(customerId, limit, offset) {
  const repo = getRepository();
  const customer = await get(customerId);
  const rows = await repo.listReleases({ customerId, limit, offset });
  const uploads = await repo.listUploads({ limit: 1000 });
  return { customer, releases: rows, uploadCount: uploads.filter(u => u.customer_id === customerId).length };
}

module.exports = { create, list, get, update, releases };