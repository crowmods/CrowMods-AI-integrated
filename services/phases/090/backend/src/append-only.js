class AppendOnlyStore{
  async append(_key,_payload){
    throw new Error("append not implemented");
  }

  async read(_key){
    throw new Error("read not implemented");
  }
}

class MemoryAppendOnlyStore extends AppendOnlyStore{
  constructor(){
    super();
    this.objects=new Map();
  }

  async append(key,payload){
    if(this.objects.has(key))
      throw new Error("Object already exists");

    this.objects.set(
      key,
      JSON.parse(JSON.stringify(payload))
    );

    return {
      key,
      stored:true,
      mode:"SIMULATION"
    };
  }

  async read(key){
    return this.objects.get(key)||null;
  }
}

module.exports={
  AppendOnlyStore,
  MemoryAppendOnlyStore
};
