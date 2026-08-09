const crypto=require("crypto");

function correlationId(){
  return crypto.randomUUID();
}

function severityFromBurnRate(burnRate){
  if(burnRate>=5)return "CRITICAL";
  if(burnRate>=2)return "HIGH";
  if(burnRate>1)return "MEDIUM";
  return "LOW";
}

function shouldCreateIncident({
  healthy,
  burnRate,
  duplicate=false
}){
  if(healthy)return false;
  if(duplicate)return false;
  return burnRate>1;
}

function closureReady({
  resolved=true,
  timelineComplete=true,
  postmortemRequired=false,
  postmortemComplete=true
}){
  return resolved &&
    timelineComplete &&
    (!postmortemRequired||postmortemComplete);
}

module.exports={
  correlationId,
  severityFromBurnRate,
  shouldCreateIncident,
  closureReady
};
