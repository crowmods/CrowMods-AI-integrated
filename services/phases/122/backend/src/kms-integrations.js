class IsolatedKmsIntegration{
  constructor({provider,version,client}){
    this.provider=provider;
    this.version=version;
    this.client=client;
  }

  async sign(input){
    if(!this.client)
      return {status:"BLOCKED",reason:"provider_client_missing"};

    try{
      const result=await this.client.sign(input);
      return {
        status:result?.signature?"SUCCESS":"FAILED",
        provider:this.provider,
        integrationVersion:this.version,
        signature:result?.signature,
        keyVersion:result?.keyVersion
      };
    }catch{
      return {
        status:"FAILED",
        provider:this.provider,
        integrationVersion:this.version
      };
    }
  }

  async verify(input){
    if(!this.client)
      return {status:"BLOCKED",reason:"provider_client_missing"};

    try{
      const result=await this.client.verify(input);
      return {
        status:result?.valid?"SUCCESS":"FAILED",
        provider:this.provider,
        integrationVersion:this.version,
        valid:Boolean(result?.valid)
      };
    }catch{
      return {
        status:"FAILED",
        provider:this.provider,
        integrationVersion:this.version
      };
    }
  }
}

class AwsKmsIntegration extends IsolatedKmsIntegration{
  constructor(client){
    super({provider:"AWS_KMS",version:"1.x",client});
  }
}
class AzureKmsIntegration extends IsolatedKmsIntegration{
  constructor(client){
    super({provider:"AZURE_KEY_VAULT",version:"1.x",client});
  }
}
class GcpKmsIntegration extends IsolatedKmsIntegration{
  constructor(client){
    super({provider:"GCP_KMS",version:"1.x",client});
  }
}

module.exports={
  IsolatedKmsIntegration,
  AwsKmsIntegration,
  AzureKmsIntegration,
  GcpKmsIntegration
};
