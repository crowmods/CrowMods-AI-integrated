function quantile(values,q){
  const sorted=values
    .map(Number)
    .filter(Number.isFinite)
    .sort((a,b)=>a-b);

  if(!sorted.length)
    return null;

  const index=Math.min(
    sorted.length-1,
    Math.max(
      0,
      Math.ceil(q*sorted.length)-1
    )
  );

  return sorted[index];
}

function calibrateQuantiles({
  residuals=[],
  lowerQuantile=.05,
  upperQuantile=.95
}){
  if(!residuals.length||
     lowerQuantile<0||
     upperQuantile>1||
     lowerQuantile>=upperQuantile)
    return {
      status:"INSUFFICIENT_DATA"
    };

  const numeric=residuals
    .map(Number)
    .filter(Number.isFinite);

  if(!numeric.length)
    return {
      status:"INSUFFICIENT_DATA"
    };

  const lower=quantile(numeric,lowerQuantile);
  const upper=quantile(numeric,upperQuantile);

  return {
    status:"CALIBRATED",
    sampleCount:numeric.length,
    lowerQuantile,
    upperQuantile,
    lowerError:lower,
    upperError:upper,
    intervalWidth:Number(
      (upper-lower).toFixed(4)
    )
  };
}

function intervalCoverage({
  actuals=[],
  predictions=[],
  lowerError,
  upperError
}){
  if(!actuals.length||
     actuals.length!==predictions.length)
    return null;

  let covered=0;

  actuals.forEach((actual,i)=>{
    const prediction=Number(
      predictions[i]
    );

    const lower=prediction+
      Number(lowerError);

    const upper=prediction+
      Number(upperError);

    if(Number(actual)>=lower &&
       Number(actual)<=upper)
      covered++;
  });

  return Number(
    (covered/actuals.length)
      .toFixed(4)
  );
}

module.exports={
  quantile,
  calibrateQuantiles,
  intervalCoverage
};
