class BrokerAdapter{
  async createTopic(_topic,_partitions){
    throw new Error("createTopic not implemented");
  }

  async publish(_topic,_key,_event){
    throw new Error("publish not implemented");
  }

  async assignPartitions(_topic,_consumerGroup,_workerId){
    throw new Error("assignPartitions not implemented");
  }

  async fetch(_topic,_partition,_offset,_limit){
    throw new Error("fetch not implemented");
  }

  async commit(_topic,_partition,_consumerGroup,_offset){
    throw new Error("commit not implemented");
  }
}

class MemoryBroker extends BrokerAdapter{
  constructor(){
    super();
    this.topics=new Map();
  }

  async createTopic(topic,partitions){
    this.topics.set(topic,{
      partitions:Array.from({length:partitions},()=>[])
    });
    return {topic,partitions};
  }

  async publish(topic,key,event){
    const target=this.topics.get(topic);
    if(!target)throw new Error("Topic not found");

    const partition=this._partition(key,target.partitions.length);
    const offset=target.partitions[partition].length;

    target.partitions[partition].push({
      offset,event
    });

    return {topic,partition,offset};
  }

  async fetch(topic,partition,offset,limit=50){
    const target=this.topics.get(topic);
    if(!target)throw new Error("Topic not found");

    return target.partitions[partition]
      .filter(item=>item.offset>=offset)
      .slice(0,limit);
  }

  async commit(topic,partition,consumerGroup,offset){
    return {
      topic,partition,consumerGroup,offset
    };
  }

  _partition(key,count){
    let hash=0;
    for(const char of String(key))
      hash=((hash<<5)-hash)+char.charCodeAt(0)|0;
    return Math.abs(hash)%count;
  }
}

module.exports={BrokerAdapter,MemoryBroker};
