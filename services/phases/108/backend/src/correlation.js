function overlapScore({
  eventStart,
  eventEnd,
  referenceStart,
  referenceEnd
}){
  const a=new Date(eventStart).getTime();
  const b=new Date(eventEnd).getTime();
  const c=new Date(referenceStart).getTime();
  const d=new Date(referenceEnd).getTime();

  if([a,b,c,d].some(Number.isNaN))
    return 0;

  const overlap=Math.max(
    0,
    Math.min(b,d)-Math.max(a,c)
  );

  const eventDuration=Math.max(
    1,
    b-a
  );

  return Number(
    (overlap/eventDuration).toFixed(3)
  );
}

function correlateChange({
  incidentStart,
  incidentEnd,
  changeStart,
  changeEnd,
  changeKey
}){
  const confidence=overlapScore({
    eventStart:incidentStart,
    eventEnd:incidentEnd,
    referenceStart:changeStart,
    referenceEnd:changeEnd
  });

  return {
    correlationType:"CHANGE",
    referenceKey:changeKey,
    confidence,
    reason:
      confidence>0
        ?"Temporal overlap detected"
        :"No temporal overlap"
  };
}

module.exports={
  overlapScore,
  correlateChange
};
