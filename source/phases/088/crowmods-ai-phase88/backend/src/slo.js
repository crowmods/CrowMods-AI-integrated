function errorBudget(targetAvailability){
  return Math.max(
    0,
    1-Number(targetAvailability)
  );
}

function availability(goodEvents,totalEvents){
  if(Number(totalEvents)<=0)
    return 1;

  return Number(goodEvents)/Number(totalEvents);
}

function burnRate({
  targetAvailability,
  goodEvents,
  totalEvents
}){
  const budget=errorBudget(targetAvailability);
  const observedError=1-
    availability(goodEvents,totalEvents);

  if(budget===0)
    return observedError===0?0:Infinity;

  return observedError/budget;
}

function windowBreach(rate,threshold=1){
  return Number(rate)>=Number(threshold);
}

function multiWindowBreach({
  fastBurn,
  slowBurn,
  fastThreshold=14,
  slowThreshold=1
}){
  return {
    fastBreached:Number(fastBurn)>=Number(fastThreshold),
    slowBreached:Number(slowBurn)>=Number(slowThreshold),
    critical:
      Number(fastBurn)>=Number(fastThreshold)&&
      Number(slowBurn)>=Number(slowThreshold)
  };
}

function sloStatus({
  fastBurn,
  slowBurn
}){
  const result=multiWindowBreach({
    fastBurn,
    slowBurn
  });

  if(result.critical) return "CRITICAL";
  if(result.fastBreached||result.slowBreached)
    return "BREACHING";

  return "HEALTHY";
}

module.exports={
  errorBudget,
  availability,
  burnRate,
  windowBreach,
  multiWindowBreach,
  sloStatus
};
