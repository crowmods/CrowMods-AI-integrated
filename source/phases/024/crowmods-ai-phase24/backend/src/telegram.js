function escapeHtml(value){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function buildPost({title,version,description,releaseUrl,features=[]}){
  const lines=[
    `<b>${escapeHtml(title)}</b>`,
    version ? `<b>Version:</b> ${escapeHtml(version)}` : "",
    "",
    escapeHtml(description||""),
    "",
    ...features.slice(0,5).map(x=>`• ${escapeHtml(x)}`),
    "",
    "CrowMods"
  ].filter(Boolean);

  return {
    text:lines.join("\n"),
    parseMode:"HTML",
    buttons:releaseUrl ? [
      [{text:"View Release",url:releaseUrl}]
    ] : []
  };
}

module.exports={buildPost,escapeHtml};
