const WORKFLOWS = {
  NEW_RELEASE: [
    "APK_PROCESS",
    "SECURITY_SCAN",
    "AI_CONTENT"
  ],
  APPROVED_RELEASE: [
    "WEBSITE_PUBLISH"
  ],
  PUBLISHED_RELEASE: [
    "TELEGRAM_PUBLISH",
    "DISCORD_PUBLISH",
    "SOCIAL_CAMPAIGN",
    "ANALYTICS_AGGREGATION"
  ]
};

function workflowFor(status){
  if(status==="PENDING_REVIEW") return WORKFLOWS.NEW_RELEASE;
  if(status==="APPROVED") return WORKFLOWS.APPROVED_RELEASE;
  if(status==="PUBLISHED") return WORKFLOWS.PUBLISHED_RELEASE;
  return [];
}

function buildPlan(release){
  const jobs=workflowFor(release.status);
  return {
    releaseId:release.id,
    status:release.status,
    mode:"policy",
    jobs:jobs.map(jobType=>({
      jobType,
      entityType:"RELEASE",
      entityId:release.id
    })),
    requiresHumanApproval: release.status==="PENDING_REVIEW" || release.status==="APPROVED"
  };
}

module.exports={WORKFLOWS,workflowFor,buildPlan};
