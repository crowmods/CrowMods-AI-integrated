function calculateTrend(values=[]){
  if(values.length<2)
    return {
      trend:"INSUFFICIENT_DATA",
      delta:null
    };

  const first=Number(values[0]);
  const last=Number(values[values.length-1]);
  const delta=Number(
    (last-first).toFixed(3)
  );

  let trend="STABLE";
  if(delta>=2) trend="IMPROVING";
  else if(delta<=-2) trend="DECLINING";

  return {
    trend,
    delta
  };
}

module.exports={
  calculateTrend
};
