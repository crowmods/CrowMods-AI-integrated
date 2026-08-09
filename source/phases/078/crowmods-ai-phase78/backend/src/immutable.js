const crypto=require("crypto");

class ImmutableExportAdapter{
  async put(_objectKey,_content,_retentionUntil){
    throw new Error("put not implemented");
  }

  async get(_objectKey){
    throw new Error("get not implemented");
  }
}

class AppendOnlyMemoryExportAdapter extends ImmutableExportAdapter{
  constructor(){
    super();
    this.objects=new Map();
  }

  async put(objectKey,content,retentionUntil=null){
    if(this.objects.has(objectKey))
      throw new Error("Object already exists");

    const hash=crypto
      .createHash("sha256")
      .update(content,"utf8")
      .digest("hex");

    this.objects.set(objectKey,{
      objectKey,
      content,
      sha256:hash,
      retentionUntil
    });

    return this.objects.get(objectKey);
  }

  async get(objectKey){
    return this.objects.get(objectKey)||null;
  }
}

function retentionUntil(days){
  const date=new Date();
  date.setUTCDate(date.getUTCDate()+Number(days));
  return date.toISOString();
}

module.exports={
  ImmutableExportAdapter,
  AppendOnlyMemoryExportAdapter,
  retentionUntil
};
