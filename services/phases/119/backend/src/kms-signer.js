class ProductionKmsSigner{
  constructor({
    provider,
    keyReference,
    client
  }){
    this.provider=provider;
    this.keyReference=keyReference;
    this.client=client;
  }

  async signDigest(digest){
    if(!this.provider||
       !this.keyReference||
       !this.client)
      return {
        status:"BLOCKED",
        reason:"kms_signer_not_configured"
      };

    const result=await this.client.sign({
      keyReference:this.keyReference,
      digest
    });

    if(!result?.signature)
      return {
        status:"FAILED",
        reason:"kms_signature_missing"
      };

    return {
      status:"SIGNED",
      provider:this.provider,
      keyReference:this.keyReference,
      keyVersion:
        result.keyVersion||"unknown",
      algorithm:
        result.algorithm||"KMS-SUPPLIED",
      signature:result.signature
    };
  }
}

module.exports={
  ProductionKmsSigner
};
