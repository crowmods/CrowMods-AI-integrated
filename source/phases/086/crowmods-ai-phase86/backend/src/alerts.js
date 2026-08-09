const severityRank={
  INFO:0,
  WARNING:1,
  HIGH:2,
  CRITICAL:3
};

function shouldSuppress({
  now,
  startsAt,
  endsAt
}){
  const current=Date.parse(now);
  return current>=Date.parse(startsAt) &&
    current<=Date.parse(endsAt);
}

function nextBackoff(attempt){
  const seconds=Math.min(
    3600,
    30*Math.pow(2,Math.max(0,Number(attempt)-1))
  );

  return new Date(
    Date.now()+seconds*1000
  ).toISOString();
}

function deliveryStatus({
  success,
  attempts,
  maxAttempts=5
}){
  if(success)
    return "SENT";

  return Number(attempts)>=Number(maxAttempts)
    ?"DLQ"
    :"FAILED";
}

function correlateAlerts(alerts){
  if(!alerts.length)
    return {
      count:0,
      sloBreach:false,
      highestSeverity:"INFO"
    };

  const highest=alerts.reduce(
    (current,alert)=>
      severityRank[alert.severity] >
      severityRank[current]
        ?alert.severity
        :current,
    "INFO"
  );

  return {
    count:alerts.length,
    sloBreach:alerts.some(a=>Boolean(a.sloBreach)),
    highestSeverity:highest
  };
}

function policyMatch(value,threshold){
  return Number(value)>=Number(threshold);
}

module.exports={
  severityRank,
  shouldSuppress,
  nextBackoff,
  deliveryStatus,
  correlateAlerts,
  policyMatch
};
