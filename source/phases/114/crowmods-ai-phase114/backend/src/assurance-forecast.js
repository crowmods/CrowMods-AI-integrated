function forecastAssurance({
  currentScore,
  slopePerPeriod,
  horizonPeriods=4
}){
  if(currentScore<0||currentScore>100||
     !Number.isFinite(slopePerPeriod)||
     horizonPeriods<1)
    return {
      status:"INSUFFICIENT_DATA",
      projectedScore:null
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

  let status="STABLE";
  if(slopePerPeriod>=1)
    status="IMPROVING";
  else if(slopePerPeriod<=-1)
    status="DECLINING";

  if(projected<60)
    status="AT_RISK";

  return {
    status,
    currentScore,
    slopePerPeriod,
    horizonPeriods,
    projectedScore:projected
  };
}

module.exports={
  forecastAssurance
};
