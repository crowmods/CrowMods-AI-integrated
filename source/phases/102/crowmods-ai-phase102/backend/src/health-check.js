const {
  validateOidcMetadata
}=require("./oidc");

const {
  certificateStatus
}=require("./certificate");

const {
  dependencyStatus
}=require("./dependency-health");

function runConfigurationChecks(env){
  const results=[];

  if(env.OIDC_JWKS_METADATA){
    try{
      results.push({
        type:"OIDC_JWKS_METADATA",
        ...validateOidcMetadata(
          JSON.parse(env.OIDC_JWKS_METADATA)
        )
      });
    }catch{
      results.push({
        type:"OIDC_JWKS_METADATA",
        status:"FAIL",
        reason:"invalid_metadata_json"
      });
    }
  }else{
    results.push({
      type:"OIDC_JWKS_METADATA",
      status:"BLOCKED",
      reason:"OIDC_JWKS_METADATA_not_configured"
    });
  }

  if(env.CERTIFICATE_DAYS_REMAINING){
    results.push({
      type:"TLS_CERTIFICATE",
      ...certificateStatus({
        daysRemaining:Number(
          env.CERTIFICATE_DAYS_REMAINING
        )
      })
    });
  }else{
    results.push({
      type:"TLS_CERTIFICATE",
      status:"BLOCKED",
      reason:"certificate_probe_not_configured"
    });
  }

  results.push({
    type:"DATABASE",
    ...dependencyStatus({
      reachable:env.DATABASE_HEALTH==="PASS",
      latencyMs:env.DATABASE_LATENCY_MS
        ?Number(env.DATABASE_LATENCY_MS)
        :null
    })
  });

  results.push({
    type:"SIEM",
    ...dependencyStatus({
      reachable:env.SIEM_HEALTH==="PASS",
      latencyMs:env.SIEM_LATENCY_MS
        ?Number(env.SIEM_LATENCY_MS)
        :null
    })
  });

  results.push({
    type:"KMS",
    ...dependencyStatus({
      reachable:env.KMS_HEALTH==="PASS",
      latencyMs:env.KMS_LATENCY_MS
        ?Number(env.KMS_LATENCY_MS)
        :null
    })
  });

  return results;
}

if(require.main===module){
  console.log(
    JSON.stringify(
      runConfigurationChecks(process.env),
      null,
      2
    )
  );
}

module.exports={
  runConfigurationChecks
};
