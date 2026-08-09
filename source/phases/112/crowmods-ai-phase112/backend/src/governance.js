const STATUSES=new Set([
  "MAPPED",
  "PARTIAL",
  "UNMAPPED"
]);

function coverage(mappings=[]){
  if(mappings.length===0)
    return {
      total:0,
      mapped:0,
      partial:0,
      unmapped:0,
      coveragePercent:null
    };

  const mapped=mappings.filter(
    x=>x==="MAPPED"
  ).length;

  const partial=mappings.filter(
    x=>x==="PARTIAL"
  ).length;

  const unmapped=mappings.filter(
    x=>x==="UNMAPPED"
  ).length;

  return {
    total:mappings.length,
    mapped,
    partial,
    unmapped,
    coveragePercent:Number(
      ((mapped/mappings.length)*100)
        .toFixed(3)
    )
  };
}

function validateMapping({
  status,
  requirementKey,
  controlId
}){
  if(!STATUSES.has(status)||
     !requirementKey||
     !controlId)
    return {
      status:"BLOCKED",
      reason:"invalid_governance_mapping"
    };

  return {
    status:"VALID"
  };
}

module.exports={
  STATUSES,
  coverage,
  validateMapping
};
