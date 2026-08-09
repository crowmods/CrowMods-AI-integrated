const PLATFORMS=[
  "telegram","discord","x","instagram",
  "facebook","reddit","youtube","whatsapp","linkedin"
];

function recommendStrategy(input){
  const category=String(input.category||"").toLowerCase();
  const hasVideo=Boolean(input.hasVideo);
  const hasScreenshots=Boolean(input.hasScreenshots);
  const audience=input.audience||"general";

  const platforms=[];
  const reasons=[];

  platforms.push("telegram");
  reasons.push("Direct community release distribution.");

  platforms.push("discord");
  reasons.push("Community discussion and release context.");

  if(hasVideo){
    platforms.push("youtube");
    reasons.push("Video asset available.");
  }

  if(hasScreenshots){
    platforms.push("instagram");
    reasons.push("Visual asset available.");
  }

  platforms.push("reddit");
  reasons.push("Longer technical/contextual release explanation.");

  if(category.includes("game")){
    platforms.push("x");
    reasons.push("Short launch/update announcement.");
  }

  const unique=[...new Set(platforms)];

  const contentAngle=
    audience==="developers" ? "technical-release"
    : category.includes("game") ? "feature-highlight"
    : "release-highlight";

  return {
    platforms:unique,
    contentAngle,
    timingWindows:[
      {name:"community-window",reason:"Use the audience's historically active period from your own analytics."},
      {name:"follow-up-window",reason:"Publish a follow-up only when campaign metrics justify it."}
    ],
    experiments:[
      {name:"CTA test",variants:["View release","Explore release"],metric:"click_through_rate"},
      {name:"headline test",variants:["Feature-led","Update-led"],metric:"engagement_rate"}
    ],
    reasons,
    constraints:[
      "Use only authorized accounts and official APIs.",
      "Do not automate unsolicited messages.",
      "Do not fabricate engagement.",
      "Keep public publishing approval-gated."
    ],
    confidence:0.72
  };
}

module.exports={recommendStrategy};
