function calculatePriority({
  likelihood,
  impact,
  exposure,
  effectiveness
}){
  const values=[
    likelihood,
    impact,
    exposure,
    effectiveness
  ].map(Number);

  if(values.some(v=>Number.isNaN(v))||
     values.some(v=>v<0))
    throw new Error("invalid_risk_inputs");

  const [l,i,e,eff]=values;

  const weakness=Math.max(
    0,
    100-eff
  );

  const score=Number(
    ((l*i*e)+(weakness*e))
      .toFixed(3)
  );

  let priority="LOW";
  if(score>=750) priority="CRITICAL";
  else if(score>=400) priority="HIGH";
  else if(score>=150) priority="MEDIUM";

  return {
    likelihood:l,
    impact:i,
    exposure:e,
    effectiveness:eff,
    priorityScore:score,
    priority
  };
}

module.exports={
  calculatePriority
};
