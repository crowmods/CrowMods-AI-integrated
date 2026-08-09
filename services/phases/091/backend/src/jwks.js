class JwksCache{
  constructor({ttlSeconds=300}={}){
    this.ttlSeconds=ttlSeconds;
    this.entries=new Map();
  }

  put(providerId,keys,now=Date.now()){
    this.entries.set(providerId,{
      keys:[...keys],
      fetchedAt:now
    });
  }

  get(providerId,now=Date.now()){
    const entry=this.entries.get(providerId);

    if(!entry) return null;

    if(now-entry.fetchedAt>
       this.ttlSeconds*1000){
      return null;
    }

    return entry.keys;
  }

  rotate(providerId,keys,now=Date.now()){
    this.put(
      providerId,
      keys.map(key=>({
        ...key,
        active:true
      })),
      now
    );
  }

  invalidate(providerId){
    this.entries.delete(providerId);
  }
}

module.exports={
  JwksCache
};
