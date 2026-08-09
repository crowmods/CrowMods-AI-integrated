function availabilityPercent({
  total,
  successful
}){
  if(total<=0)
    return null;

  if(successful<0||successful>total)
    throw new Error(
      "invalid_success_count"
    );

  return Number(
    ((successful/total)*100).toFixed(3)
  );
}

function evaluateSlo({
  total,
  successful,
  targetPercent
}){
  const availability=
    availabilityPercent({
      total,
      successful
    });

  if(availability===null)
    return {
      status:"BLOCKED",
      availabilityPercent:null
    };

  return {
    status:
      availability>=targetPercent
        ?"PASS"
        :"BREACH",
    availabilityPercent:availability,
    targetPercent
  };
}

function breachSeverity({
  targetPercent,
  availabilityPercent
}){
  const gap=targetPercent-availabilityPercent;

  if(gap>=5) return "CRITICAL";
  if(gap>=1) return "HIGH";
  return "MEDIUM";
}

module.exports={
  availabilityPercent,
  evaluateSlo,
  breachSeverity
};
