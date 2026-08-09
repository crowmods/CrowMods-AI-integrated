function calculateRiskTrend(scores=[]){
  if(scores.length<2)
    return {
      trend:"INSUFFICIENT_DATA",
      delta:null
    };

  const first=Number(scores[0]);
  const last=Number(scores[scores.length-1]);

  if(!Number.isFinite(first)||
     !Number.isFinite(last))
    return {
      trend:"INSUFFICIENT_DATA",
      delta:null
    };

  const delta=Number(
    (last-first).toFixed(3)
  );

  let trend="STABLE";
  if(delta<=-5)
    trend="IMPROVING";
  else if(delta>=5)
    trend="WORSENING";

  return {
    trend,
    delta
  };
}

module.exports={
  calculateRiskTrend
};
