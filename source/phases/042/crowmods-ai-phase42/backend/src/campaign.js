const PLATFORMS=[
  "telegram","discord","whatsapp","x",
  "instagram","facebook","reddit","youtube","linkedin"
];

function makeDraft(platform,page){
  const title=page.title||"New Release";
  const url=page.canonical_url||null;
  const description=page.summary||"New release update.";

  const templates={
    telegram:`${title}\n\n${description}\n\nDetails: ${url||"Link pending"}`,
    discord:`**${title}**\n${description}\n\n${url||"Link pending"}`,
    whatsapp:`${title}\n${description}\n${url||"Link pending"}`,
    x:`${title} — ${description} ${url||""}`.trim(),
    instagram:`${title}\n\n${description}\n\nSee the full release page for details.`,
    facebook:`${title}\n\n${description}\n\n${url||"Link pending"}`,
    reddit:`Title: ${title}\n\n${description}\n\n${url||"Link pending"}`,
    youtube:`${title} — ${description}`,
    linkedin:`${title}\n\n${description}\n\n${url||"Link pending"}`
  };

  return {
    title,
    body:templates[platform]||description,
    link:url,
    hashtags:page.tags||[]
  };
}

function buildCampaign(page){
  return {
    name:`${page.title||"Release"} Campaign`,
    objective:"AWARENESS",
    posts:PLATFORMS.map(platform=>({
      platform,
      content:makeDraft(platform,page)
    }))
  };
}

module.exports={PLATFORMS,buildCampaign};
