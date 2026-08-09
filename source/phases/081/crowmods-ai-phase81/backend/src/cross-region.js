function replicationHealthy({
  lagSeconds,
  maxLagSeconds=60
}){
  return Number(lagSeconds)<=Number(maxLagSeconds);
}

function regionHealth({
  availability,
  errorRate,
  replicationLag,
  maxErrorRate=.02,
  maxReplicationLag=60
}){
  const availabilityScore=Math.max(
    0,
    Math.min(1,Number(availability))
  );

  const errorScore=Math.max(
    0,
    Math.min(1,1-Number(errorRate)/Number(maxErrorRate||1))
  );

  const replicationScore=Math.max(
    0,
    Math.min(1,1-Number(replicationLag)/Number(maxReplicationLag||1))
  );

  const score=Number(
    ((availabilityScore*.5)+
     (errorScore*.25)+
     (replicationScore*.25)).toFixed(4)
  );

  return {
    score,
    healthy:score>=.9
  };
}

function chooseRecoveryRegion(regions){
  return regions
    .filter(region=>region.enabled&&region.healthy)
    .sort((a,b)=>{
      if(b.healthScore!==a.healthScore)
        return b.healthScore-a.healthScore;

      return a.replicationLag-b.replicationLag;
    })[0]||null;
}

function failbackReady({
  replicationHealthy,
  targetHealthHealthy,
  dataIntegrityVerified,
  trafficReady
}){
  return Boolean(
    replicationHealthy&&
    targetHealthHealthy&&
    dataIntegrityVerified&&
    trafficReady
  );
}

module.exports={
  replicationHealthy,
  regionHealth,
  chooseRecoveryRegion,
  failbackReady
};
