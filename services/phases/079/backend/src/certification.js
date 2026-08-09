function integrationCertification({
  kmsReady,
  wormReady,
  retentionReady,
  healthChecksPassed
}){
  const certified=
    Boolean(kmsReady) &&
    Boolean(wormReady) &&
    Boolean(retentionReady) &&
    Boolean(healthChecksPassed);

  return {
    certified,
    gates:{
      kmsReady:Boolean(kmsReady),
      wormReady:Boolean(wormReady),
      retentionReady:Boolean(retentionReady),
      healthChecksPassed:Boolean(healthChecksPassed)
    }
  };
}

function drValidation({
  backupVerified,
  restoreVerified,
  integrityVerified,
  providerReconnectVerified
}){
  const passed=
    Boolean(backupVerified) &&
    Boolean(restoreVerified) &&
    Boolean(integrityVerified) &&
    Boolean(providerReconnectVerified);

  return {
    passed,
    gates:{
      backupVerified:Boolean(backupVerified),
      restoreVerified:Boolean(restoreVerified),
      integrityVerified:Boolean(integrityVerified),
      providerReconnectVerified:Boolean(providerReconnectVerified)
    }
  };
}

module.exports={
  integrationCertification,
  drValidation
};
