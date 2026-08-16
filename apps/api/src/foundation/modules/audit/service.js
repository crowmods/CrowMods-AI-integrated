const { getRepository } = require("../../db");

const SECRET_KEYS = /(password|passwd|secret|token|api[_-]?key|authorization|credential)/i;

function sanitize(value, depth = 0) {
  if (depth > 4) return value;
  if (Array.isArray(value)) return value.map(v => sanitize(v, depth + 1));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEYS.test(k) ? "[REDACTED]" : sanitize(v, depth + 1);
    }
    return out;
  }
  return value;
}

async function log({ actorId, actorEmail, action, resource, resourceId, result = "SUCCESS", ip, metadata = {} }) {
  const repo = getRepository();
  return repo.createAuditLog({ actorId, actorEmail, action, resource, resourceId, result, ip, metadata: sanitize(metadata) });
}

async function list({ limit, offset, action, resource }) {
  const repo = getRepository();
  return repo.listAuditLogs({ limit, offset, action, resource });
}

async function count() {
  const repo = getRepository();
  return repo.countAuditLogs();
}

module.exports = { log, list, count };