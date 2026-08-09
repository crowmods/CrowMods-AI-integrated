function normalizeEvent({
  eventType,
  severity="LOW",
  subject=null,
  resource=null,
  action=null,
  source="crowmods",
  correlationId,
  payload={}
}){
  if(!eventType)
    throw new Error("event_type_required");

  if(!correlationId)
    throw new Error("correlation_id_required");

  return {
    eventType,
    severity,
    subject,
    resource,
    action,
    source,
    correlationId,
    payload
  };
}

class DevelopmentSiemAdapter{
  constructor(){
    this.events=[];
  }

  async send(event){
    this.events.push(event);
    return {
      delivered:true,
      mode:"SIMULATION"
    };
  }
}

module.exports={
  normalizeEvent,
  DevelopmentSiemAdapter
};
