function timelineEvent({
  eventType,
  actor,
  description,
  metadata={}
}){
  return {
    eventType,
    actor,
    description,
    metadata,
    createdAt:new Date().toISOString()
  };
}

function sortTimeline(events){
  return [...events].sort(
    (a,b)=>
      Date.parse(a.createdAt)-
      Date.parse(b.createdAt)
  );
}

module.exports={
  timelineEvent,
  sortTimeline
};
