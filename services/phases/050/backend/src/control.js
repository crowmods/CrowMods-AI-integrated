const MODULES=[
  "releases",
  "media",
  "campaigns",
  "connectors",
  "community",
  "support",
  "knowledge",
  "analytics",
  "revenue",
  "subscriptions"
];

const ROLE_ACCESS={
  OWNER:MODULES,
  ADMIN:MODULES,
  EDITOR:["releases","media","campaigns","knowledge"],
  SUPPORT:["community","support","subscriptions"],
  ANALYST:["analytics","revenue","subscriptions"]
};

function allowed(role,module){
  return (ROLE_ACCESS[role]||[]).includes(module);
}

function summarizeHealth(results){
  const values=Object.values(results);
  const healthy=values.filter(x=>x.status==="healthy").length;
  const degraded=values.filter(x=>x.status==="degraded").length;
  const down=values.filter(x=>x.status==="down").length;

  return {
    healthy,
    degraded,
    down,
    total:values.length,
    overall:down>0?"down":degraded>0?"degraded":"healthy"
  };
}

module.exports={MODULES,ROLE_ACCESS,allowed,summarizeHealth};
