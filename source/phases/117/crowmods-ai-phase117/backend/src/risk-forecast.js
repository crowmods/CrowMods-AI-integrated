function forecastRisk({
  currentScore,
  slopePerPeriod,
  horizonPeriods=4
}){
  if(!Number.isFinite(currentScore)||
     !Number.isFinite(slopePerPeriod)||
     currentScore<0||
     horizonPeriods<1)
    return {
      status:"CRITICAL",
      projectedScore:null
    };

  const projected=Math.max(
    0,
    Number(
      (currentScore+
        slopePerPeriod*horizonPeriods)
        .toFixed(3)
    )
  );

  let status="STABLE";

  if(slopePerPeriod<=-1)
    status="IMPROVING";
  else if(slopePerPeriod>=1)
    status="WORSENING";

  if(projected>=75)
    status="CRITICAL";

  return {
    status,
    currentScore,
    slopePerPeriod,
    horizonPeriods,
    projectedScore:projected
  };
}

module.exports={
  forecastRisk
};
