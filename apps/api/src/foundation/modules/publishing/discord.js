const { getRepository } = require("../../db");

function buildEmbed(release, upload) {
  const version = release.version || upload?.metadata?.versionName || "latest";
  const packageName = release.package_name || upload?.metadata?.package || "";
  const fields = [{ name: "Version", value: version, inline: true }];
  if (packageName) fields.push({ name: "Package", value: packageName, inline: true });
  if (upload?.size_bytes) {
    fields.push({ name: "Size", value: `${(upload.size_bytes / 1048576).toFixed(2)} MB`, inline: true });
  }
  return {
    embeds: [{
      title: release.name,
      description: release.description || "New release available.",
      color: 0x5865F2,
      fields,
      footer: { text: `CrowMods AI • ${release.slug}` }
    }]
  };
}

async function publish(release, upload, job) {
  const repo = getRepository();
  const integration = (await repo.listIntegrations()).find(i => i.provider === "discord");
  const config = integration?.config || {};
  const webhookUrl = config.webhookUrl;

  const simulated = !webhookUrl;
  let externalId = null;
  let metadata = { simulated, mode: simulated ? "mock" : "api" };

  if (!simulated) {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildEmbed(release, upload))
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord API error: ${res.status} ${text.slice(0, 200)}`);
    }
    const json = await res.json().catch(() => null);
    externalId = json?.id ? String(json.id) : `discord-${Date.now()}`;
    metadata = { ...metadata, id: externalId };
  } else {
    externalId = `mock-${Date.now()}`;
    metadata = { ...metadata, embed: buildEmbed(release, upload) };
  }

  return {
    status: "SUCCESS",
    provider: "discord",
    externalId,
    publishedAt: new Date().toISOString(),
    error: null,
    metadata
  };
}

function preview(release, upload) {
  return { provider: "discord", payload: buildEmbed(release, upload) };
}

module.exports = { publish, preview };