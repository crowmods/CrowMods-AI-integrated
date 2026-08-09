function validateIngestionEvent({
  source,
  eventType,
  eventTime,
  sourceEventId
}){
  if(!source||!eventType||!eventTime)
    return {
      status:"BLOCKED",
      reason:"required_event_fields_missing"
    };

  const timestamp=new Date(eventTime);

  if(Number.isNaN(timestamp.getTime()))
    return {
      status:"BLOCKED",
      reason:"invalid_event_time"
    };

  return {
    status:"ACCEPTED",
    source,
    eventType,
    eventTime:timestamp.toISOString(),
    sourceEventId:sourceEventId||null
  };
}

function deduplicateEvents(events=[]){
  const seen=new Set();
  return events.filter(event=>{
    const key=event.sourceEventId||
      `${event.source}:${event.eventType}:${event.eventTime}`;

    if(seen.has(key))
      return false;

    seen.add(key);
    return true;
  });
}

module.exports={
  validateIngestionEvent,
  deduplicateEvents
};
