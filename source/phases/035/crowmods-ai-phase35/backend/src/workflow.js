const MAX_STEPS=[
  "SECURITY_SCAN",
  "AI_METADATA",
  "APPROVAL_GATE",
  "PUBLIC_RELEASE",
  "CAMPAIGN_PREPARATION",
  "PUBLISH_QUEUE",
  "ANALYTICS"
];

const HIGH_IMPACT=new Set([
  "PUBLIC_RELEASE",
  "PUBLISH_QUEUE"
]);

function nextStep(current){
  const i=MAX_STEPS.indexOf(current);
  if(i<0)return MAX_STEPS[0];
  return MAX_STEPS[i+1]||null;
}

function requiresApproval(step){
  return HIGH_IMPACT.has(step);
}

function buildEvent(type,aggregateType,aggregateId,payload={}){
  return {
    eventType:type,
    aggregateType,
    aggregateId:String(aggregateId),
    payload
  };
}

module.exports={MAX_STEPS,nextStep,requiresApproval,buildEvent};
