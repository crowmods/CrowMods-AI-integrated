function calculatePredictionIntervals({
  residuals=[],
  projectedScore,
  horizonPeriods=4,
  coverageTarget=.95
}){
  if(!residuals.length||
     !Number.isFinite(projectedScore)||
     horizonPeriods<1||
     coverageTarget<=0||
     coverageTarget>=1)
    return {
      status:"INSUFFICIENT_DATA"
    };

  const abs= residuals
    .map(Number)
    .filter(Number.isFinite)
    .map(Math.abs)
    .sort((a,b)=>a-b);

  if(!abs.length)
    return {
      status:"INSUFFICIENT_DATA"
    };

  const index=Math.min(
    abs.length-1,
    Math.max(
      0,
      Math.ceil(
        coverageTarget*abs.length
      )-1
    )
  );

  const residualBound=abs[index];
  const horizonScale=Math.sqrt(
    horizonPeriods
  );

  const width=Number(
    (2*residualBound*horizonScale)
      .toFixed(3)
  );

  const lower=Math.max(
    0,
    Number(
      (projectedScore-
       residualBound*horizonScale)
       .toFixed(3)
    )
  );

  const upper=Math.min(
    100,
    Number(
      (projectedScore+
       residualBound*horizonScale)
       .toFixed(3)
    )
  );

  return {
    status:"CALCULATED",
    lowerBound:lower,
    upperBound:upper,
    intervalWidth:width,
    coverageTarget,
    horizonPeriods
  };
}

function empiricalCoverage({
  predictions=[],
  actuals=[],
  bounds=[]
}){
  if(!predictions.length||
     predictions.length!==actuals.length||
     predictions.length!==bounds.length)
    return null;

  let covered=0;

  predictions.forEach((prediction,i)=>{
    const lower=bounds[i]?.lower;
    const upper=bounds[i]?.upper;

    if(Number(actuals[i])>=Number(lower) &&
       Number(actuals[i])<=Number(upper))
      covered++;
  });

  return Number(
    (covered/predictions.length)
      .toFixed(4)
  );
}

module.exports={
  calculatePredictionIntervals,
  empiricalCoverage
};
