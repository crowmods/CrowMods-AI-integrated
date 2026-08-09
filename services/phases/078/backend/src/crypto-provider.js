const crypto=require("crypto");

class SigningKeyProvider{
  async currentKey(){
    throw new Error("currentKey not implemented");
  }

  async sign(_payload){
    throw new Error("sign not implemented");
  }

  async verify(_payload,_signature,_key){
    throw new Error("verify not implemented");
  }
}

class Ed25519MemoryKeyProvider extends SigningKeyProvider{
  constructor(){
    super();
    this.keys=new Map();
    this.activeVersion=1;

    const pair=crypto.generateKeyPairSync("ed25519");

    this.keys.set(1,{
      keyId:"memory-key-v1",
      keyVersion:1,
      algorithm:"Ed25519",
      publicKey:pair.publicKey,
      privateKey:pair.privateKey,
      status:"ACTIVE"
    });
  }

  rotate(){
    const version=this.activeVersion+1;
    const pair=crypto.generateKeyPairSync("ed25519");

    const current=this.keys.get(this.activeVersion);
    if(current) current.status="RETIRED";

    this.keys.set(version,{
      keyId:`memory-key-v${version}`,
      keyVersion:version,
      algorithm:"Ed25519",
      publicKey:pair.publicKey,
      privateKey:pair.privateKey,
      status:"ACTIVE"
    });

    this.activeVersion=version;
    return this.keys.get(version);
  }

  async currentKey(){
    return this.keys.get(this.activeVersion);
  }

  async sign(payload){
    const key=await this.currentKey();
    const signer=crypto.createSign("SHA256");
    signer.update(payload);
    signer.end();

    const signature=crypto.sign(
      null,
      Buffer.from(payload),
      key.privateKey
    ).toString("base64");

    return {
      keyId:key.keyId,
      keyVersion:key.keyVersion,
      algorithm:key.algorithm,
      signature
    };
  }

  async verify(payload,signature,keyVersion){
    const key=this.keys.get(Number(keyVersion));

    if(!key) return false;

    return crypto.verify(
      null,
      Buffer.from(payload),
      key.publicKey,
      Buffer.from(signature,"base64")
    );
  }
}

module.exports={
  SigningKeyProvider,
  Ed25519MemoryKeyProvider
};
