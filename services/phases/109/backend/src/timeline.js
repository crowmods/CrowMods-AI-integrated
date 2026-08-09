function buildTimeline(events=[]){
  return [...events]
    .map(event=>({
      ...event,
      timestamp:new Date(
        event.timestamp||event.eventTime
      ).toISOString()
    }))
    .sort((a,b)=>
      new Date(a.timestamp)-
      new Date(b.timestamp)
    );
}

function addEvent({
  events,
  type,
  timestamp,
  source,
  referenceKey=null,
  summary,
  metadata={}
}){
  return buildTimeline([
    ...events,
    {
      eventType:type,
      timestamp,
      source,
      referenceKey,
      summary,
      metadata
    }
  ]);
}

module.exports={
  buildTimeline,
  addEvent
};
