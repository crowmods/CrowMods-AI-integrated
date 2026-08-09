function escapeHtml(value="") {
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function buildCampaign(release, template="release", baseUrl) {
  const b = release.aiBrief || {};
  const title = escapeHtml(b.title || release.originalName);
  const category = escapeHtml(b.suggestedCategory || "Android");
  const description = escapeHtml(
    b.shortDescription || b.description || "New release prepared by CrowMods."
  );
  const tags = (b.tags || [])
    .slice(0, 8)
    .map(t => `#${String(t).replace(/[^a-zA-Z0-9_]/g, "")}`)
    .filter(Boolean)
    .join(" ");

  const url = `${baseUrl.replace(/\/$/, "")}/apps/${release.publicPage?.slug || release.id}`;
  const size = `${Math.round((release.sizeBytes || 0) / 1024 / 1024)} MB`;

  const headers = {
    release: "🦅 <b>CROWMODS — NEW RELEASE</b>",
    update: "🔄 <b>CROWMODS — UPDATE AVAILABLE</b>",
    featured: "⭐ <b>CROWMODS — FEATURED RELEASE</b>"
  };

  const text = `${headers[template] || headers.release}

🎮 <b>${title}</b>

📦 <b>Category:</b> ${category}
💾 <b>Size:</b> ${size}

📝 ${description}

${tags}

━━━━━━━━━━━━━━━━━━
🚀 <b>GET IT FROM CROWMODS</b>`;

  return {
    text,
    url,
    buttonText: "🚀 DOWNLOAD",
    imageUrl: release.campaign?.imageUrl || null
  };
}

module.exports = { buildCampaign };
