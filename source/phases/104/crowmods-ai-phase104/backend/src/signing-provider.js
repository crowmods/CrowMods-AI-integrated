class SigningProvider{
  constructor(config={}){
    this.provider=config.provider||"UNCONFIGURED";
    this.keyId=config.keyId||null;
    this.algorithm=config.algorithm||"UNCONFIGURED";
  }

  configurationStatus(){
    return {
      configured:Boolean(
        this.keyId &&
        this.provider &&
        this.algorithm
      ),
      provider:this.provider,
      keyId:this.keyId,
      algorithm:this.algorithm
    };
  }

  async sign(_digest){
    throw new Error(
      "Production signing provider not implemented"
    );
  }

  async verify(_digest,_signature){
    throw new Error(
      "Production verification provider not implemented"
    );
  }
}

class DevelopmentSigningProvider extends SigningProvider{
  constructor({secret="development-only"}={}){
    super({
      provider:"DEVELOPMENT",
      keyId:"dev-key",
      algorithm:"HMAC-SHA256"
    });
    this.secret=secret;
  }

  async sign(digest){
    const crypto=require("crypto");
    return crypto
      .createHmac("sha256",this.secret)
      .update(digest)
      .digest("hex");
  }

  async verify(digest,signature){
    const expected=await this.sign(digest);

    if(String(signature).length!==expected.length)
      return false;

    return cryptoTimingSafeEqual(
      expected,
      String(signature)
    );
  }
}

function cryptoTimingSafeEqual(a,b){
  const crypto=require("crypto");
  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
}

module.exports={
  SigningProvider,
  DevelopmentSigningProvider
};
