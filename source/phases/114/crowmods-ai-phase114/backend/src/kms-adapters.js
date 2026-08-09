const PROVIDERS=new Set([
  "AWS_KMS",
  "AZURE_KEY_VAULT",
  "GCP_KMS",
  "HSM_GENERIC"
]);

function validateAdapterConfig({
  provider,
  keyReference
}){
  if(!PROVIDERS.has(provider))
    return {
      status:"BLOCKED",
      reason:"unsupported_kms_provider"
    };

  if(!keyReference)
    return {
      status:"BLOCKED",
      reason:"key_reference_required"
    };

  return {
    status:"VALID",
    provider,
    keyReference
  };
}

class ProductionKmsAdapter{
  constructor({
    provider,
    keyReference,
    client
  }){
    this.provider=provider;
    this.keyReference=keyReference;
    this.client=client;
  }

  async verifyDigestSignature(digest,signature){
    if(!this.client)
      throw new Error("kms_client_not_configured");

    return this.client.verify({
      keyReference:this.keyReference,
      digest,
      signature
    });
  }
}

module.exports={
  PROVIDERS,
  validateAdapterConfig,
  ProductionKmsAdapter
};
