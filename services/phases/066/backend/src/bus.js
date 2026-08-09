const crypto=require("crypto");

class EventBus{
  constructor(){
    this.handlers=new Map();
  }

  subscribe(eventType,handler){
    if(!this.handlers.has(eventType))
      this.handlers.set(eventType,[]);
    this.handlers.get(eventType).push(handler);
  }

  async publish(event){
    const normalized={
      eventId:event.eventId||crypto.randomUUID(),
      eventType:event.eventType,
      sourceService:event.sourceService,
      correlationId:event.correlationId||crypto.randomUUID(),
      payload:event.payload||{},
      occurredAt:event.occurredAt||new Date().toISOString()
    };

    for(const handler of this.handlers.get(normalized.eventType)||[])
      await handler(normalized);

    return normalized;
  }
}

module.exports={EventBus};
