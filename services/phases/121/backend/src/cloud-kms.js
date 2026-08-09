class KmsAdapter{
  constructor({
    provider,
    client
  }){
    this.provider=provider;
    this.client=client;
  }

  async sign({
    keyReference,
    digest,
    algorithm
  }){
    if(!this.client||
       !keyReference)
      return {
        status:"BLOCKED",
        reason:"kms_client_or_key_missing"
      };

    const result=await this.client.sign({
      keyReference,
      digest,
      algorithm
    });

    return {
      status:result?.signature
        ?"SUCCESS"
        :"FAILED",
      provider:this.provider,
      keyReference,
      algorithm,
      keyVersion:result?.keyVersion,
      signature:result?.signature
    };
  }

  async verify({
    keyReference,
    digest,
    signature,
    algorithm
  }){
    if(!this.client||
       !keyReference)
      return {
        status:"BLOCKED",
        reason:"kms_client_or_key_missing"
      };

    const result=await this.client.verify({
      keyReference,
      digest,
      signature,
      algorithm
    });

    return {
      status:result?.valid
        ?"SUCCESS"
        :"FAILED",
      provider:this.provider,
      keyReference,
      algorithm,
      valid:Boolean(result?.valid)
    };
  }
}

class AwsKmsAdapter extends KmsAdapter{
  constructor(client){
    super({
      provider:"AWS_KMS",
      client
    });
  }
}

class AzureKeyVaultAdapter extends KmsAdapter{
  constructor(client){
    super({
      provider:"AZURE_KEY_VAULT",
      client
    });
  }
}

class GcpKmsAdapter extends KmsAdapter{
  constructor(client){
    super({
      provider:"GCP_KMS",
      client
    });
  }
}

module.exports={
  KmsAdapter,
  AwsKmsAdapter,
  AzureKeyVaultAdapter,
  GcpKmsAdapter
};
