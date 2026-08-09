function updateOnlineCalibration({
  residualWindow=[],
  coverageTarget=.9,
  actuals=[],
  predictions=[]
}){
  const residuals=residualWindow
    .map(Number)
    .filter(Number.isFinite)
    .map(Math.abs);

  if(!residuals.length)
    return {status:"INSUFFICIENT_DATA"};

  const sorted=[...residuals].sort((a,b)=>a-b);
  const index=Math.min(
    sorted.length-1,
    Math.max(0,Math.ceil(
      coverageTarget*sorted.length
    )-1)
  );

  const radius=sorted[index];

  let coverage=null;
  if(actuals.length &&
     actuals.length===predictions.length){
    let covered=0;
    for(let i=0;i<actuals.length;i++){
      const actual=Number(actuals[i]);
      const prediction=Number(predictions[i]);
      if(actual>=prediction-radius &&
         actual<=prediction+radius)
        covered++;
    }
    coverage=Number(
      (covered/actuals.length).toFixed(4)
    );
  }

  return {
    status:"UPDATED",
    windowSize:residuals.length,
    coverageTarget,
    intervalRadius:radius,
    empiricalCoverage:coverage
  };
}

module.exports={updateOnlineCalibration};
