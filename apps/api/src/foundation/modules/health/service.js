const { getRepository } = require("../../db");

async function check() {
  const repo = getRepository();
  const result = {
    api: "HEALTHY",
    database: "HEALTHY",
    storage: "HEALTHY",
    queue: "HEALTHY",
    website: "HEALTHY",
    telegram: "UNKNOWN",
    discord: "UNKNOWN"
  };

  try {
    if (repo.constructor.name === "MemoryRepository") {
      result.database = "DEGRADED";
    } else {
      await repo.countUploadsByStatus();
    }
  } catch {
    result.database = "DOWN";
  }

  const uploads = await repo.listUploads({ limit: 5 }).catch(() => []);
  if (uploads.length === 0) result.storage = "DEGRADED";

  try {
    const jobs = await repo.listJobs({ limit: 1 });
    result.queue = "HEALTHY";
  } catch {
    result.queue = "DOWN";
  }

  const integrations = await repo.listIntegrations().catch(() => []);
  for (const i of integrations) {
    if (i.provider === "telegram") result.telegram = i.status === "DISCONNECTED" ? "UNKNOWN" : i.status;
    if (i.provider === "discord") result.discord = i.status === "DISCONNECTED" ? "UNKNOWN" : i.status;
  }

  return result;
}

module.exports = { check };