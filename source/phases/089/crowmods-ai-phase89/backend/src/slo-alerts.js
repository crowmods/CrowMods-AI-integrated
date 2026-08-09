function evaluateRule({
  fastBurn,
  slowBurn,
  fastThreshold,
  slowThreshold
}){
  const fastBreached=
    Number(fastBurn)>=Number(fastThreshold);

  const slowBreached=
    Number(slowBurn)>=Number(slowThreshold);

  return {
    fastBreached,
    slowBreached,
    breached:fastBreached||slowBreached,
    critical:fastBreached&&slowBreached
  };
}

function alertSeverity({
  breached,
  critical,
  configuredSeverity="WARNING"
}){
  if(!breached) return "INFO";
  if(critical) return "CRITICAL";
  return configuredSeverity;
}

module.exports={
  evaluateRule,
  alertSeverity
};
