function calculateReliability({
  totalChecks,
  successfulChecks,
  failedChecks,
  burnAlerts=0
}){
  if(totalChecks<0||
     successfulChecks<0||
     failedChecks<0||
     successfulChecks+failedChecks!==totalChecks)
    throw new Error(
      "invalid_reliability_counts"
    );

  const availability=
    totalChecks===0
      ?null
      :Number(
        ((successfulChecks/totalChecks)*100)
          .toFixed(3)
      );

  return {
    totalChecks,
    successfulChecks,
    failedChecks,
    availabilityPercent:availability,
    burnAlerts
  };
}

module.exports={
  calculateReliability
};
