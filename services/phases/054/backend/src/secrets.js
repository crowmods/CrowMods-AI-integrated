const crypto=require("crypto");

class EnvSecretProvider{
  async get(name){
    const value=process.env[name];

    if(!value)
      throw new Error(`Secret not configured: ${name}`);

    return value;
  }

  async rotate(name){
    return {
      provider:"env",
      secretName:name,
      status:"ROTATION_REQUIRES_EXTERNAL_SECRET_MANAGER"
    };
  }
}

/*
  Production adapters should wrap AWS Secrets Manager, GCP Secret Manager,
  Azure Key Vault, HashiCorp Vault, or another approved secret store.
  Raw secret values should remain in process memory only as long as required.
*/
function createSecretProvider(){
  return new EnvSecretProvider();
}

function fingerprint(value){
  return crypto.createHash("sha256")
    .update(String(value||""))
    .digest("hex")
    .slice(0,16);
}

module.exports={createSecretProvider,fingerprint};
