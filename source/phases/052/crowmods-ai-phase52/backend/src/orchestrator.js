const AGENTS=[
  "Content",
  "Release",
  "Campaign",
  "Community",
  "Support",
  "Analytics",
  "Revenue",
  "Security"
];

const HIGH_IMPACT=[
  "release.publish",
  "campaign.publish",
  "moderation.action",
  "price.change"
];

function chooseAgent(taskType=""){
  const t=String(taskType).toLowerCase();

  if(t.includes("release"))return "Release";
  if(t.includes("campaign"))return "Campaign";
  if(t.includes("community")||t.includes("moderation"))return "Community";
  if(t.includes("support"))return "Support";
  if(t.includes("analytics")||t.includes("growth"))return "Analytics";
  if(t.includes("revenue")||t.includes("pricing"))return "Revenue";
  if(t.includes("security"))return "Security";
  return "Content";
}

function approvalRequired(tool){
  return HIGH_IMPACT.includes(tool);
}

function buildPlan(goal){
  const g=String(goal).toLowerCase();
  const tasks=[];

  if(g.includes("release")){
    tasks.push(
      {agent:"Release",taskType:"release.validate",tool:"release.create"},
      {agent:"Content",taskType:"release.announce",tool:"campaign.draft"}
    );
  }

  if(g.includes("campaign")||g.includes("marketing")){
    tasks.push(
      {agent:"Analytics",taskType:"growth.context",tool:"analytics.read"},
      {agent:"Campaign",taskType:"campaign.draft",tool:"campaign.create"}
    );
  }

  if(g.includes("support")||g.includes("community")){
    tasks.push(
      {agent:"Community",taskType:"community.summary",tool:"support.draft"}
    );
  }

  if(!tasks.length){
    tasks.push({
      agent:chooseAgent(goal),
      taskType:"general.analysis",
      tool:"knowledge.search"
    });
  }

  return tasks.map((x,i)=>({
    ...x,
    sequenceNo:i,
    approvalRequired:approvalRequired(x.tool)
  }));
}

module.exports={
  AGENTS,
  chooseAgent,
  approvalRequired,
  buildPlan
};
