const REQUIRED_PRODUCTION=[
  "OIDC_ISSUER",
  "OIDC_AUDIENCE",
  "OIDC_JWKS_URI",
  "OIDC_JWKS_HOSTS",
  "DATABASE_URL",
  "EVIDENCE_KMS_KEY_ID",
  "SIEM_ENDPOINT"
];

function validateProductionConfig(env){
  const checks=[];

  for(const name of REQUIRED_PRODUCTION){
    checks.push({
      name,
      status:env[name]?"PASS":"BLOCKED",
      reason:env[name]
        ?"configured"
        :"required production configuration missing"
    });
  }

  if(env.OIDC_JWKS_URI){
    let uri;

    try{
      uri=new URL(env.OIDC_JWKS_URI);
    }catch{
      uri=null;
    }

    checks.push({
      name:"OIDC_JWKS_URI_HTTPS",
      status:uri?.protocol==="https:"?"PASS":"FAIL",
      reason:uri?.protocol==="https:"
        ?"HTTPS configured"
        :"JWKS URI must use HTTPS"
    });
  }

  if(env.NODE_ENV==="production"){
    checks.push({
      name:"NODE_ENV_PRODUCTION",
      status:"PASS",
      reason:"production mode enabled"
    });
  }else{
    checks.push({
      name:"NODE_ENV_PRODUCTION",
      status:"BLOCKED",
      reason:"NODE_ENV is not production"
    });
  }

  return checks;
}

module.exports={
  REQUIRED_PRODUCTION,
  validateProductionConfig
};
