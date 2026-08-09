function buildAnnouncement(release, baseUrl) {
  const b = release.aiBrief || {};
  const title = b.title || release.originalName;
  const description = b.shortDescription || b.description || "New CrowMods release.";
  const url = `${baseUrl.replace(/\/$/,"")}/apps/${release.publicPage?.slug || release.id}`;

  return {
    content: `🦅 **CrowMods — New Release**\n\n**${title}**\n\n${description}\n\n[🚀 Open on CrowMods](${url})`,
    embeds: [{
      title,
      description,
      url,
      fields: [
        {name:"Category", value:b.suggestedCategory || "Uncategorized", inline:true},
        {name:"Size", value:`${Math.round((release.sizeBytes||0)/1024/1024)} MB`, inline:true},
        {name:"SHA-256", value:release.sha256 || "Not available"}
      ],
      footer:{text:"CrowMods AI"}
    }]
  };
}

async function discordRequest(token, method, endpoint, body) {
  const response = await fetch(`https://discord.com/api/v10${endpoint}`, {
    method,
    headers: {
      "Authorization": `Bot ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!response.ok) throw new Error(data.message || `Discord API error (${response.status})`);
  return data;
}

async function publishAnnouncement(release) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;
  const baseUrl = process.env.CROWMODS_PUBLIC_BASE_URL || "http://localhost:3000";
  const dryRun = String(process.env.DISCORD_DRY_RUN).toLowerCase() !== "false";
  const payload = buildAnnouncement(release, baseUrl);

  if (dryRun || !token || !channelId) return {dryRun:true,payload};

  return discordRequest(token, "POST", `/channels/${channelId}/messages`, payload);
}

module.exports = {buildAnnouncement,publishAnnouncement};
