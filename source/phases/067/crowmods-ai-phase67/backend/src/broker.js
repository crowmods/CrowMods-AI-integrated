class BrokerAdapter{
  constructor(){
    this.handlers=new Map();
  }

  async publish(topic,event){
    const handlers=this.handlers.get(topic)||[];

    for(const handler of handlers)
      await handler(event);

    return {
      accepted:true,
      topic,
      eventId:event.eventId
    };
  }

  subscribe(topic,consumerGroup,handler){
    const key=`${topic}:${consumerGroup}`;

    if(!this.handlers.has(key))
      this.handlers.set(key,[]);

    this.handlers.get(key).push(handler);
  }
}

module.exports={BrokerAdapter};
