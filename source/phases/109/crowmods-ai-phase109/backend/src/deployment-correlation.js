function correlateDeployment({
  incidentStart,
  incidentEnd,
  deploymentStart,
  deploymentEnd,
  deploymentKey,
  commitSha
}){
  const startA=new Date(
    incidentStart
  ).getTime();

  const endA=new Date(
    incidentEnd
  ).getTime();

  const startB=new Date(
    deploymentStart
  ).getTime();

  const endB=new Date(
    deploymentEnd
  ).getTime();

  if([startA,endA,startB,endB]
    .some(Number.isNaN))
    return {
      status:"BLOCKED",
      reason:"invalid_timestamps"
    };

  const overlap=Math.max(
    0,
    Math.min(endA,endB)-
    Math.max(startA,startB)
  );

  const incidentDuration=Math.max(
    1,
    endA-startA
  );

  const confidence=Number(
    (overlap/incidentDuration)
      .toFixed(3)
  );

  return {
    status:overlap>0
      ?"CORRELATED"
      :"NO_CORRELATION",
    deploymentKey,
    commitSha,
    confidence
  };
}

module.exports={
  correlateDeployment
};
