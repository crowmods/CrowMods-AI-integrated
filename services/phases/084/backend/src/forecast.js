function linearTrend(values){
  if(values.length<2) return 0;

  const n=values.length;
  const xMean=(n-1)/2;
  const yMean=values.reduce((a,b)=>a+b,0)/n;

  let numerator=0;
  let denominator=0;

  for(let i=0;i<n;i++){
    numerator+=(i-xMean)*(values[i]-yMean);
    denominator+=(i-xMean)**2;
  }

  return denominator===0?0:numerator/denominator;
}

function forecastScore(values,horizonPoints=1){
  const trend=linearTrend(values);
  const current=Number(values[values.length-1]||0);
  const forecast=Math.max(
    0,
    Math.min(1,current+trend*Number(horizonPoints))
  );

  return {
    current,
    trend:Number(trend.toFixed(6)),
    forecast:Number(forecast.toFixed(6))
  };
}

function riskLevel(score){
  if(score<.4) return "CRITICAL";
  if(score<.6) return "HIGH";
  if(score<.8) return "MEDIUM";
  return "LOW";
}

function degradationDetected({
  currentScore,
  forecastScore,
  threshold=.8
}){
  return Number(currentScore)>=threshold &&
    Number(forecastScore)<threshold;
}

module.exports={
  linearTrend,
  forecastScore,
  riskLevel,
  degradationDetected
};
