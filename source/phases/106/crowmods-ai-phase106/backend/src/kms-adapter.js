class ProductionKmsAdapter{
  constructor({
    provider,
    keyId,
    algorithm
  }={}){
    this.provider=provider||null;
    this.keyId=keyId||null;
    this.algorithm=algorithm||null;
  }

  configurationStatus(){
    return {
      status:
        this.provider&&
        this.keyId&&
        this.algorithm
          ?"PASS"
          :"BLOCKED",
      provider:this.provider,
      keyId:this.keyId,
      algorithm:this.algorithm
    };
  }

  async sign(){
    throw new Error(
      "Implement approved KMS/HSM adapter"
    );
  }

  async verify(){
    throw new Error(
      "Implement approved KMS/HSM adapter"
    );
  }
}

module.exports={
  ProductionKmsAdapter
};
