const { getRepository } = require("../../db");

function buildMessage(release, upload) {
  const version = release.version || upload?.metadata?.versionName || "latest";
  const packageName = release.package_name || upload?.metadata?.package || "";
  const lines = [
    `**${release.name}** v${version}`,
    "",
    release.description || "New release available.",
    ""
  ];
  if (packageName) lines.push(`Package: \`${packageName}\``);
  lines.push("", `#releases`);
  return lines.join("\n");
}

async function publish(release, upload, job) {
  const repo = getRepository();
  const integration = (await repo.listIntegrations()).find(i => i.provider === "telegram");
  const config = integration?.config || {};
  const token = config.botToken;
  const chatId = config.chatId;

  const simulated = !token || !chatId;
  let externalId = null;
  let metadata = { simulated, mode: simulated ? "mock" : "api" };

  if (!simulated) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: buildMessage(release, upload),
      parse_mode: "Markdown",
      disable_web_page_preview: true
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      throw new Error(`Telegram API error: ${json.description || res.status}`);
    }
    externalId = String(json.result.message_id);
    metadata = { ...metadata, messageId: externalId, chatId };
  } else {
    externalId = `mock-${Date.now()}`;
    metadata = { ...metadata, chatId: chatId || "mock-channel", message: buildMessage(release, upload) };
  }

  return {
    status: "SUCCESS",
    provider: "telegram",
    externalId,
    publishedAt: new Date().toISOString(),
    error: null,
    metadata
  };
}

function preview(release, upload) {
  return { provider: "telegram", message: buildMessage(release, upload) };
}

module.exports = { publish, preview };