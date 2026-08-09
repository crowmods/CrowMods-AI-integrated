async function telegramRequest(token, method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API error (${response.status})`);
  }
  return data;
}

function escapeHtml(value="") {
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function buildPost(release, baseUrl) {
  const b = release.aiBrief || {};
  const title = escapeHtml(b.title || release.originalName);
  const description = escapeHtml(b.shortDescription || b.description || "New CrowMods release.");
  const category = escapeHtml(b.suggestedCategory || "Uncategorized");
  const tags = (b.tags || []).slice(0,8).map(t => `#${String(t).replace(/[^a-zA-Z0-9_]/g,"")}`).join(" ");
  const url = `${baseUrl.replace(/\/$/,"")}/apps/${release.publicPage?.slug || release.id}`;

  return {
    text:
`🦅 <b>CROWMODS — NEW RELEASE</b>

🎮 <b>${title}</b>

📦 <b>Category:</b> ${category}
💾 <b>Size:</b> ${Math.round((release.sizeBytes || 0) / 1024 / 1024)} MB

📝 ${description}

${tags}

━━━━━━━━━━━━━━━━━━
<b>DOWNLOAD</b>`,
    url
  };
}

async function publishTelegram(release) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  const baseUrl = process.env.CROWMODS_PUBLIC_BASE_URL || "http://localhost:3000";
  const dryRun = String(process.env.TELEGRAM_DRY_RUN).toLowerCase() !== "false";

  const post = buildPost(release, baseUrl);

  if (dryRun || !token || !chatId) {
    return {
      dryRun: true,
      message: post.text,
      buttonUrl: post.url
    };
  }

  return telegramRequest(token, "sendMessage", {
    chat_id: chatId,
    text: post.text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "🚀 DOWNLOAD", url: post.url }
      ]]
    },
    disable_web_page_preview: false
  });
}

module.exports = { publishTelegram, buildPost };
