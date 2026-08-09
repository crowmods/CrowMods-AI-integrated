function dependencyStatus({
  reachable,
  latencyMs=null,
  maxLatencyMs=2000
}){
  if(!reachable)
    return {
      status:"FAIL",
      reason:"dependency_unreachable"
    };

  if(latencyMs!==null&&latencyMs>maxLatencyMs)
    return {
      status:"WARN",
      reason:"dependency_latency_high"
    };

  return {
    status:"PASS",
    reason:"dependency_healthy"
  };
}

module.exports={
  dependencyStatus
};
