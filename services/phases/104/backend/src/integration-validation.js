function validateProductionIntegrations(env){
  const required=[
    "KMS_PROVIDER",
    "KMS_KEY_ID",
    "KMS_ALGORITHM",
    "SIEM_ENDPOINT",
    "SIEM_AUTH_MODE",
    "SIEM_AUDIENCE"
  ];

  return required.map(name=>({
    name,
    status:env[name]?"PASS":"BLOCKED"
  }));
}

if(require.main===module){
  console.log(
    JSON.stringify(
      validateProductionIntegrations(
        process.env
      ),
      null,
      2
    )
  );
}

module.exports={
  validateProductionIntegrations
};
