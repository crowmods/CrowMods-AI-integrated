function capacityScore({
  availability,
  utilization,
  replicationLag,
  recoveryReadiness
}){
  const availabilityScore=Math.max(
    0,Math.min(1,Number(availability))
  );

  const utilizationScore=Math.max(
    0,Math.min(1,1-Number(utilization))
  );

  const replicationScore=Math.max(
    0,Math.min(1,1-Number(replicationLag)/60)
  );

  const recoveryScore=Math.max(
    0,Math.min(1,Number(recoveryReadiness))
  );

  const score=Number((
    availabilityScore*.35+
    utilizationScore*.20+
    replicationScore*.20+
    recoveryScore*.25
  ).toFixed(4));

  return {
    score,
    healthy:score>=.8
  };
}

function chaosResult({
  injectionSucceeded,
  recoverySucceeded,
  rollbackSucceeded
}){
  const score=(
    Number(injectionSucceeded)+
    Number(recoverySucceeded)+
    Number(rollbackSucceeded)
  )/3;

  return {
    score:Number(score.toFixed(4)),
    passed:score>=1
  };
}

function resilienceGrade(score){
  const value=Number(score);

  if(value>=.95) return "A+";
  if(value>=.9) return "A";
  if(value>=.8) return "B";
  if(value>=.7) return "C";
  if(value>=.6) return "D";
  return "F";
}

function overallResilience({
  recoveryScore,
  capacityScore,
  chaosScore
}){
  const score=Number((
    Number(recoveryScore)*.4+
    Number(capacityScore)*.3+
    Number(chaosScore)*.3
  ).toFixed(4));

  return {
    score,
    grade:resilienceGrade(score)
  };
}

module.exports={
  capacityScore,
  chaosResult,
  resilienceGrade,
  overallResilience
};
