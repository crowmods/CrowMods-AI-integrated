const PLATFORMS=[
  "telegram","discord","x","instagram",
  "facebook","reddit","youtube","whatsapp","linkedin"
];

function clean(value){
  if(value===undefined||value===null)return null;
  return String(value).trim()||null;
}

function buildIntelligence(facts){
  const appName=clean(facts.appName);
  const versionName=clean(facts.versionName);
  const category=clean(facts.category)||"Uncategorized";
  const verifiedFacts=Array.isArray(facts.verifiedFacts)
    ?facts.verifiedFacts.map(clean).filter(Boolean)
    :[];

  const tags=[category.toLowerCase()];
  if(facts.isGame)tags.push("game");
  if(facts.isApp)tags.push("app");

  const description=appName
    ?`${appName}${versionName?` ${versionName}`:""} — verified release information.`
    :"Verified release information.";

  const seoTitle=appName
    ?`${appName}${versionName?` ${versionName}`:""} | CrowMods`
    :"Release | CrowMods";

  const seoDescription=appName
    ?`View verified information, compatibility and release details for ${appName}.`
    :"View verified release information on CrowMods.";

  const changelog=Array.isArray(facts.changelog)
    ?facts.changelog.map(clean).filter(Boolean)
    :[];

  const social={};

  for(const platform of PLATFORMS){
    social[platform]={
      title:appName||"New Release",
      body:`${appName||"New release"}${versionName?` — ${versionName}`:""} is now available for review.`,
      url:facts.releaseUrl||null
    };
  }

  return {
    appName,
    packageName:clean(facts.packageName),
    versionName,
    versionCode:clean(facts.versionCode),
    category,
    tags:[...new Set(tags)],
    compatibility:Array.isArray(facts.compatibility)
      ?facts.compatibility.map(clean).filter(Boolean):[],
    description,
    changelog,
    seoTitle,
    seoDescription,
    sourceFacts:{
      verifiedFacts,
      suppliedFields:Object.keys(facts)
    },
    confidence:verifiedFacts.length?0.8:0.45,
    social
  };
}

module.exports={PLATFORMS,buildIntelligence};
