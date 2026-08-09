const rank={
  INFO:0,
  WARNING:1,
  HIGH:2,
  CRITICAL:3
};

function correlateSecurityEvents(events){
  if(!events.length){
    return {
      eventCount:0,
      highestSeverity:"INFO",
      suspicious:false
    };
  }

  const highest=events.reduce(
    (current,event)=>
      rank[event.severity||"INFO"]>
      rank[current]
        ?event.severity||"INFO"
        :current,
    "INFO"
  );

  const denied=events.filter(
    event=>event.allowed===false
  ).length;

  const suspicious=
    denied>=3 ||
    highest==="CRITICAL";

  return {
    eventCount:events.length,
    highestSeverity:highest,
    suspicious,
    deniedCount:denied
  };
}

module.exports={
  correlateSecurityEvents
};
