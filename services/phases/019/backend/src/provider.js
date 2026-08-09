function buildPrompt(input) {
  return {
    system: [
      "You are CrowMods AI Content Engine.",
      "Create concise, factual metadata from verified release information.",
      "Never invent features, versions, permissions, ratings, licenses, or security claims.",
      "Return valid JSON only."
    ].join(" "),
    user: JSON.stringify({
      task:"generate_release_content",
      verifiedMetadata:input
    })
  };
}

async function generateWithStub(input) {
  const title = input.appName || input.originalName || "Untitled Release";
  const version = input.versionName || "Unknown";
  const category = input.category || "Android";
  const description = input.verifiedDescription || "Release information is available on the CrowMods release page.";

  return {
    title,
    shortDescription:`${title} ${version} — ${category} release.`,
    description,
    features:Array.isArray(input.verifiedFeatures) ? input.verifiedFeatures.slice(0,10) : [],
    whatsNew:Array.isArray(input.verifiedChanges) ? input.verifiedChanges.slice(0,10) : [],
    seoTitle:`${title} ${version} | CrowMods`,
    seoDescription:description.slice(0,155),
    tags:[category.toLowerCase(),"android","crowmods"].filter(Boolean),
    telegramCaption:`🦅 ${title} — ${version}\n\n${description}`,
    discordCaption:`**${title}** — ${version}\n\n${description}`,
    socialCaption:`${title} — ${version}\n\n${description}`
  };
}

async function generateContent(input) {
  const provider=process.env.AI_PROVIDER || "stub";

  // Replace this adapter with the selected provider's current official SDK/API.
  // Keep API keys server-side and never expose them to the browser.
  if(provider==="stub") return generateWithStub(input);

  throw new Error(`AI provider '${provider}' is not configured in this phase.`);
}

module.exports={buildPrompt,generateContent};
