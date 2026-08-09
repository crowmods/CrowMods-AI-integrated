const crypto=require("crypto");

class KMSAdapter{
  async health(){
    throw new Error("health not implemented");
  }

  async sign(_payload){
    throw new Error("sign not implemented");
  }

  async verify(_payload,_signature,_keyVersion){
    throw new Error("verify not implemented");
  }
}

class DevelopmentKMSAdapter extends KMSAdapter{
  constructor(){
    super();
    this.version=1;
    this.pair=crypto.generateKeyPairSync("ed25519");
  }

  async health(){
    return {
      healthy:true,
      provider:"development-kms",
      capabilities:{
        signing:true,
        verification:true,
        rotation:true
      }
    };
  }

  async sign(payload){
    const signature=crypto.sign(
      null,
      Buffer.from(payload),
      this.pair.privateKey
    ).toString("base64");

    return {
      algorithm:"Ed25519",
      keyVersion:this.version,
      signature
    };
  }

  async verify(payload,signature,keyVersion){
    if(Number(keyVersion)!==this.version)
      return false;

    return crypto.verify(
      null,
      Buffer.from(payload),
      this.pair.publicKey,
      Buffer.from(signature,"base64")
    );
  }
}

class WORMAdapter{
  async health(){
    throw new Error("health not implemented");
  }

  async put(_objectKey,_content,_retentionUntil){
    throw new Error("put not implemented");
  }

  async verifyRetention(_objectKey,_retentionUntil){
    throw new Error("verifyRetention not implemented");
  }
}

class DevelopmentWORMAdapter extends WORMAdapter{
  constructor(){
    super();
    this.objects=new Map();
  }

  async health(){
    return {
      healthy:true,
      provider:"development-worm",
      capabilities:{
        objectLock:true,
        retention:true,
        appendOnly:true
      }
    };
  }

  async put(objectKey,content,retentionUntil){
    if(this.objects.has(objectKey))
      throw new Error("Object is immutable and already exists");

    const sha256=crypto
      .createHash("sha256")
      .update(content,"utf8")
      .digest("hex");

    this.objects.set(objectKey,{
      objectKey,
      sha256,
      content,
      retentionUntil
    });

    return this.objects.get(objectKey);
  }

  async verifyRetention(objectKey,retentionUntil){
    const object=this.objects.get(objectKey);

    return Boolean(
      object &&
      object.retentionUntil===retentionUntil
    );
  }
}

module.exports={
  KMSAdapter,
  DevelopmentKMSAdapter,
  WORMAdapter,
  DevelopmentWORMAdapter
};
