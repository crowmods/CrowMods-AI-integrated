function calibrateForecasts({
  predictions=[],
  actuals=[]
}){
  if(predictions.length===0||
     predictions.length!==actuals.length)
    return {
      status:"INSUFFICIENT_DATA",
      sampleCount:0
    };

  const errors=predictions.map(
    (prediction,index)=>
      Number(actuals[index])-
      Number(prediction)
  );

  if(errors.some(
    value=>!Number.isFinite(value)
  ))
    return {
      status:"INSUFFICIENT_DATA",
      sampleCount:0
    };

  const mae=errors.reduce(
    (sum,value)=>sum+Math.abs(value),
    0
  )/errors.length;

  const bias=errors.reduce(
    (sum,value)=>sum+value,
    0
  )/errors.length;

  const confidence=Math.max(
    0,
    Math.min(
      100,
      Number(
        (100/(1+mae))
          .toFixed(3)
      )
    )
  );

  return {
    status:"CALIBRATED",
    sampleCount:errors.length,
    meanAbsoluteError:Number(
      mae.toFixed(4)
    ),
    bias:Number(
      bias.toFixed(4)
    ),
    calibratedConfidence:confidence
  };
}

module.exports={
  calibrateForecasts
};
