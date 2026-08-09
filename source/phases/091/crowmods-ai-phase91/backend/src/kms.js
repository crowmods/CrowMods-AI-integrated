const crypto=require("crypto");

class SigningProvider{
  async sign(_payload){
    throw new Error("sign not implemented");
  }

  async verify(_payload,_signature){
    throw new Error("verify not implemented");
  }

  async health(){
    throw new Error("health not implemented");
  }
}

class MemoryKmsProvider extends SigningProvider{
  constructor({secret="development-secret"}={}){
    super();
    this.secret=secret;
    this.version="dev-v1";
  }

  async sign(payload){
    const signature=crypto
      .createHmac("sha256",this.secret)
      .update(String(payload))
      .digest("hex");

    return {
      signature,
      keyVersion:this.version,
      algorithm:"HMAC-SHA256",
      mode:"SIMULATION"
    };
  }

  async verify(payload,signature){
    const expected=crypto
      .createHmac("sha256",this.secret)
      .update(String(payload))
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(String(signature))
    );
  }

  async health(){
    return {
      healthy:true,
      provider:"memory-kms",
      mode:"SIMULATION",
      keyVersion:this.version
    };
  }

  rotate(secret){
    this.secret=secret;
    this.version=`dev-${Date.now()}`;
  }
}

module.exports={
  SigningProvider,
  MemoryKmsProvider
};
