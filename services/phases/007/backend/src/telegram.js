const { buildCampaign } = require("./campaign");

async function request(token, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  const data = await r.json();
  if (!r.ok || !data.ok) throw new Error(data.description || "Telegram API error");
  return data;
}

async function publishCampaign(release, template="release") {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  const baseUrl = process.env.CROWMODS_PUBLIC_BASE_URL || "http://localhost:3000";
  const dryRun = String(process.env.TELEGRAM_DRY_RUN).toLowerCase() !== "false";
  const campaign = buildCampaign(release, template, baseUrl);

  if (dryRun || !token || !chatId) {
    return {dryRun:true, campaign};
  }

  const keyboard = {
    inline_keyboard: [[{text:campaign.buttonText, url:campaign.url}]]
  };

  if (campaign.imageUrl) {
    return request(token, "sendPhoto", {
      chat_id: chatId,
      photo: campaign.imageUrl,
      caption: campaign.text,
      parse_mode: "HTML",
      reply_markup: keyboard
    });
  }

  return request(token, "sendMessage", {
    chat_id: chatId,
    text: campaign.text,
    parse_mode: "HTML",
    reply_markup: keyboard
  });
}

module.exports = {publishCampaign};
