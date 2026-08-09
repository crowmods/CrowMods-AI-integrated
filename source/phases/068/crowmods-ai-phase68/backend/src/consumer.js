function isAlreadyProcessed(processed){
  return Boolean(processed);
}

function lagSeconds(latestOccurredAt,lastProcessedAt){
  if(!latestOccurredAt||!lastProcessedAt)return null;
  return Math.max(
    0,
    (Date.parse(latestOccurredAt)-Date.parse(lastProcessedAt))/1000
  );
}

function consumerHealth({
  lagSecondsValue,
  errorRate,
  maxLagSeconds=60,
  maxErrorRate=.02
}){
  const checks={
    lag:lagSecondsValue===null||lagSecondsValue<=maxLagSeconds,
    errors:Number(errorRate)<=maxErrorRate
  };

  return {
    healthy:Object.values(checks).every(Boolean),
    checks
  };
}

module.exports={
  isAlreadyProcessed,
  lagSeconds,
  consumerHealth
};
