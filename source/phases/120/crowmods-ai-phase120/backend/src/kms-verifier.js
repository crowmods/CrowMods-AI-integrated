class ProductionKmsVerifier{
  constructor({
    provider,
    keyReference,
    client
  }){
    this.provider=provider;
    this.keyReference=keyReference;
    this.client=client;
  }

  async verifyDigest({
    digest,
    signature,
    algorithm
  }){
    if(!this.provider||
       !this.keyReference||
       !this.client)
      return {
        status:"BLOCKED",
        reason:"kms_verifier_not_configured"
      };

    const result=await this.client.verify({
      keyReference:this.keyReference,
      digest,
      signature,
      algorithm
    });

    return {
      status:result?.valid
        ?"VALID"
        :"INVALID",
      provider:this.provider,
      keyReference:this.keyReference,
      algorithm
    };
  }
}

module.exports={
  ProductionKmsVerifier
};
