const PLATFORM_NAMES = [
  "telegram",
  "discord",
  "instagram",
  "facebook",
  "youtube",
  "x"
];

function connectionStatus(platform) {
  const configured = {
    telegram: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHANNEL_ID,
    discord: !!process.env.DISCORD_BOT_TOKEN && !!process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID,
    instagram: !!process.env.META_CONNECTION_ID,
    facebook: !!process.env.META_CONNECTION_ID,
    youtube: !!process.env.YOUTUBE_CONNECTION_ID,
    x: !!process.env.X_CONNECTION_ID
  };
  return configured[platform] ? "CONNECTED" : "NOT_CONNECTED";
}

function buildPlatformContent(release, platform, baseUrl) {
  const b = release.aiBrief || {};
  const title = b.title || release.originalName;
  const description = b.shortDescription || b.description || "New CrowMods release.";
  const url = `${baseUrl.replace(/\/$/,"")}/apps/${release.publicPage?.slug || release.id}`;
  const tags = (b.tags || []).slice(0,6).map(x => `#${String(x).replace(/[^a-zA-Z0-9_]/g,"")}`).join(" ");

  const content = {
    telegram: {
      format: "HTML",
      text: `🦅 <b>CROWMODS — NEW RELEASE</b>\n\n🎮 <b>${title}</b>\n\n${description}\n\n${tags}`,
      url
    },
    discord: {
      format: "EMBED",
      title,
      description,
      url
    },
    instagram: {
      format: "CAPTION",
      text: `🦅 CROWMODS — ${title}\n\n${description}\n\n${tags}\n\n${url}`
    },
    facebook: {
      format: "POST",
      text: `CrowMods — ${title}\n\n${description}\n\n${url}`
    },
    youtube: {
      format: "METADATA",
      title: `CrowMods — ${title}`,
      description: `${description}\n\n${url}\n\n${tags}`
    },
    x: {
      format: "POST",
      text: `🦅 ${title}\n\n${description}\n\n${url}\n\n${tags}`
    }
  };

  return content[platform];
}

module.exports = { PLATFORM_NAMES, connectionStatus, buildPlatformContent };
