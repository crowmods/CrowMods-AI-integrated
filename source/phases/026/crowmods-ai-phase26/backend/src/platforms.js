const PLATFORMS=[
  "telegram","discord","x","instagram","facebook",
  "reddit","youtube","whatsapp","linkedin"
];

function truncate(text,max){
  return String(text||"").slice(0,max);
}

function buildTarget(platform,input){
  const title=input.title||"Release";
  const description=input.description||"";
  const url=input.releaseUrl||"";

  switch(platform){
    case "telegram":
      return {
        text:`<b>${truncate(title,200)}</b>\n\n${truncate(description,2500)}`,
        buttons:url?[[{text:"View Release",url}]]:[]
      };
    case "discord":
      return {
        content:"",
        embeds:[{
          title:truncate(title,256),
          description:truncate(description,4096),
          url
        }]
      };
    case "x":
      return {text:truncate(`${title}\n\n${description}\n\n${url}`,280)};
    case "instagram":
      return {caption:truncate(`${title}\n\n${description}\n\n${url}`,2200)};
    case "facebook":
      return {message:truncate(`${title}\n\n${description}\n\n${url}`,5000)};
    case "reddit":
      return {title:truncate(title,300),text:truncate(`${description}\n\n${url}`,40000)};
    case "youtube":
      return {
        title:truncate(title,100),
        description:truncate(`${description}\n\n${url}`,5000)
      };
    case "whatsapp":
      return {text:truncate(`${title}\n\n${description}\n\n${url}`,4000)};
    case "linkedin":
      return {text:truncate(`${title}\n\n${description}\n\n${url}`,3000)};
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function buildCampaign(input,platforms=PLATFORMS){
  return platforms.map(platform=>({
    platform,
    content:buildTarget(platform,input),
    status:"DRAFT"
  }));
}

module.exports={PLATFORMS,buildTarget,buildCampaign};
