function shouldEscalate({
  status,
  acknowledgedAt,
  lastNotifiedAt,
  now=Date.now(),
  ackTimeoutMs=10*60*1000
}){
  if(status==="RESOLVED")return false;
  if(status==="ACKNOWLEDGED")return false;

  const reference=lastNotifiedAt||acknowledgedAt;
  if(!reference)return true;

  return now-Date.parse(reference)>=ackTimeoutMs;
}

function nextLevel(current,maxLevel=3){
  const next=Number(current)+1;
  return next>maxLevel?null:next;
}

function retryDelay(attempt){
  return Math.min(300000,1000*Math.pow(2,attempt));
}

module.exports={shouldEscalate,nextLevel,retryDelay};
