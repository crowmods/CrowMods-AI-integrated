function measureRecovery({
  startedAt,
  completedAt,
  backupTimestamp,
  recoveryTimestamp
}){
  const start=Date.parse(startedAt);
  const complete=Date.parse(completedAt);
  const backup=Date.parse(backupTimestamp);
  const recovery=Date.parse(recoveryTimestamp);

  return {
    rtoSeconds:Math.max(0,(complete-start)/1000),
    rpoSeconds:Math.max(0,(recovery-backup)/1000)
  };
}

function targetResult({
  rtoSeconds,
  rpoSeconds,
  rtoTargetSeconds,
  rpoTargetSeconds
}){
  const rtoPass=Number(rtoSeconds)<=Number(rtoTargetSeconds);
  const rpoPass=Number(rpoSeconds)<=Number(rpoTargetSeconds);

  return {
    rtoPass,
    rpoPass,
    passed:rtoPass&&rpoPass
  };
}

function certification({
  snapshotValid,
  restoreValid,
  integrityValid,
  providerReconnectValid,
  rtoPass,
  rpoPass
}){
  const gates={
    snapshotValid:Boolean(snapshotValid),
    restoreValid:Boolean(restoreValid),
    integrityValid:Boolean(integrityValid),
    providerReconnectValid:Boolean(providerReconnectValid),
    rtoPass:Boolean(rtoPass),
    rpoPass:Boolean(rpoPass)
  };

  return {
    certified:Object.values(gates).every(Boolean),
    gates
  };
}

module.exports={
  measureRecovery,
  targetResult,
  certification
};
