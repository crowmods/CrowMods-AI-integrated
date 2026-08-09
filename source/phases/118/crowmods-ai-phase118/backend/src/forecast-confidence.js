function forecastWithConfidence({
  currentScore,
  slopePerPeriod,
  horizonPeriods=4,
  volatility=5
}){
  if(!Number.isFinite(currentScore)||
     !Number.isFinite(slopePerPeriod)||
     !Number.isFinite(volatility)||
     currentScore<0||
     currentScore>100||
     horizonPeriods<1||
     volatility<0)
    return {
      status:"INSUFFICIENT_DATA",
      confidence:0
    };

  const projected=Math.max(
    0,
    Math.min(
      100,
      Number(
        (currentScore+
          slopePerPeriod*horizonPeriods)
          .toFixed(3)
      )
    )
  );

  const margin=Number(
    (volatility*
      Math.sqrt(horizonPeriods))
      .toFixed(3)
  );

  const lower=Math.max(
    0,
    Number((projected-margin).toFixed(3))
  );

  const upper=Math.min(
    100,
    Number((projected+margin).toFixed(3))
  );

  const confidence=Math.max(
    0,
    Math.min(
      100,
      Number(
        (100/(1+volatility))
          .toFixed(3)
      )
    )
  );

  return {
    status:"CALCULATED",
    currentScore,
    projectedScore:projected,
    lowerBound:lower,
    upperBound:upper,
    confidence,
    horizonPeriods
  };
}

module.exports={
  forecastWithConfidence
};
