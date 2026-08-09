class ProductionKmsContract{
  constructor({
    provider,
    keyId,
    algorithm,
    region=null
  }={}){
    this.provider=provider||null;
    this.keyId=keyId||null;
    this.algorithm=algorithm||null;
    this.region=region;
  }

  validate(){
    const missing=[];

    for(const [name,value] of [
      ["provider",this.provider],
      ["keyId",this.keyId],
      ["algorithm",this.algorithm]
    ]){
      if(!value) missing.push(name);
    }

    return {
      status:missing.length
        ?"BLOCKED"
        :"PASS",
      missing
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
  ProductionKmsContract
};
