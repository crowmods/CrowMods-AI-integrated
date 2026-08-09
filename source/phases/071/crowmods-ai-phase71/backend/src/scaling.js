function scalingRecommendation({
  currentWorkers,
  lag,
  targetLag,
  minWorkers=1,
  maxWorkers=20,
  scaleStep=1
}){
  const current=Math.max(0,Number(currentWorkers));
  const value=Math.max(0,Number(lag));
  const target=Math.max(1,Number(targetLag));

  if(value>target){
    return {
      action:"SCALE_OUT",
      desiredWorkers:Math.min(
        maxWorkers,
        current+Math.max(1,scaleStep)
      ),
      reason:"Consumer lag is above target"
    };
  }

  if(value<target*.25 && current>minWorkers){
    return {
      action:"SCALE_IN",
      desiredWorkers:Math.max(
        minWorkers,
        current-Math.max(1,scaleStep)
      ),
      reason:"Consumer lag is substantially below target"
    };
  }

  return {
    action:"HOLD",
    desiredWorkers:current,
    reason:"Capacity is within target range"
  };
}

function recoveryHealthy({
  lagBefore,
  lagAfter,
  errorRate,
  maxErrorRate=.02
}){
  return {
    healthy:
      Number(lagAfter)<Number(lagBefore) &&
      Number(errorRate)<=maxErrorRate,
    lagImproved:Number(lagAfter)<Number(lagBefore),
    errorRateHealthy:Number(errorRate)<=maxErrorRate
  };
}

module.exports={scalingRecommendation,recoveryHealthy};
