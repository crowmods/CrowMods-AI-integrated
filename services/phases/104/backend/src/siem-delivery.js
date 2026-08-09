function buildAuthenticatedEvent({
  eventId,
  payload,
  accessToken
}){
  if(!eventId||!accessToken)
    throw new Error(
      "event_id_and_access_token_required"
    );

  return {
    eventId,
    headers:{
      authorization:`Bearer ${accessToken}`,
      "content-type":"application/json"
    },
    body:JSON.stringify(payload)
  };
}

function deliveryPolicy({
  attempt,
  maxAttempts=3,
  statusCode
}){
  if(statusCode>=200&&statusCode<300)
    return {
      status:"DELIVERED",
      retry:false
    };

  if(attempt<maxAttempts)
    return {
      status:"RETRYING",
      retry:true
    };

  return {
    status:"FAILED",
    retry:false
  };
}

module.exports={
  buildAuthenticatedEvent,
  deliveryPolicy
};
