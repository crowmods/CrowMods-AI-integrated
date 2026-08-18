const { getRepository } = require("../../db");

async function connect({ provider, name, config, targetId }, actorId, ip) {
  const repo = getRepository();
  if (!["telegram", "discord", "website"].includes(provider)) {
    const err = new Error("Unsupported integration provider");
    err.status = 400;
    throw err;
  }
  const sanitized = {};
  for (const [k, v] of Object.entries(config || {})) {
    if (v === undefined) continue;
    if (provider === "website" && (k === "publicDomain" || k === "adminPanelUrl") && v !== "" && !isValidHttpUrl(String(v))) {
      const err = new Error(`${k} must be a valid http(s) URL (e.g. https://mods.example.com)`);
      err.status = 400;
      throw err;
    }
    sanitized[k] = String(v);
  }
  const existing = (await repo.listIntegrations()).find(i => i.provider === provider);
  const integration = existing
    ? await repo.updateIntegration(existing.id, {
        name: name || existing.name || provider,
        status: "CONNECTED",
        config: { ...(existing.config || {}), ...sanitized },
        target_id: targetId ?? existing.target_id
      })
    : await repo.createIntegration({
        provider, name: name || provider, status: "CONNECTED", config: sanitized, targetId
      });
  await repo.createAuditLog({
    actorId, action: "INTEGRATION_CONNECTED", resource: "integration",
    resourceId: integration.id, ip, metadata: { provider }
  });
  return integration;
}

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function test(provider) {
  const repo = getRepository();
  const integration = (await repo.listIntegrations()).find(i => i.provider === provider);
  if (!integration) {
    const err = new Error(`No ${provider} integration configured.`);
    err.status = 404;
    throw err;
  }
  const config = integration.config;
  let ok = true;
  let detail = "configuration present";
  if (provider === "telegram" && (!config.botToken || !config.chatId)) {
    ok = false;
    detail = "botToken/chatId missing";
  }
  if (provider === "discord" && !config.webhookUrl) {
    ok = false;
    detail = "webhookUrl missing";
  }
  return { provider, ok, detail, simulated: ok && !config.botToken && !config.webhookUrl };
}

async function disconnect(id, actorId, ip) {
  const repo = getRepository();
  const integration = await repo.findIntegrationById(id);
  if (!integration) {
    const err = new Error("Integration not found");
    err.status = 404;
    throw err;
  }
  await repo.updateIntegration(id, { status: "DISCONNECTED" });
  await repo.createAuditLog({
    actorId, action: "INTEGRATION_DISCONNECTED", resource: "integration",
    resourceId: id, ip, metadata: { provider: integration.provider }
  });
  return { ok: true };
}

async function list() {
  const repo = getRepository();
  return repo.listIntegrations();
}

module.exports = { connect, test, disconnect, list };