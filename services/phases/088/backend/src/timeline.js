let lastCreatedAtMs=0;

function timelineEvent({
eventType,
actor,
description,
metadata={}
}){
let createdAtMs=Date.now();

if(createdAtMs<=lastCreatedAtMs)
createdAtMs=lastCreatedAtMs+1;

lastCreatedAtMs=createdAtMs;

return {
eventType,
actor,
description,
metadata,
createdAt:new Date(createdAtMs).toISOString()
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
