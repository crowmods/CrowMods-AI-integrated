function normalizeProbeResult({
  probeType,
  target=null,
  status,
  latencyMs=null,
  details={}
}){
  const allowed=[
    "PASS",
    "WARN",
    "FAIL",
    "BLOCKED"
  ];

  if(!allowed.includes(status))
    throw new Error("invalid_probe_status");

  return {
    probeType,
    target,
    status,
    latencyMs,
    details
  };
}

function severityForStatus(status){
  if(status==="FAIL") return "HIGH";
  if(status==="BLOCKED") return "HIGH";
  if(status==="WARN") return "MEDIUM";
  return null;
}

module.exports={
  normalizeProbeResult,
  severityForStatus
};
