function envelope({
  eventId,
  eventType,
  schemaVersion=1,
  sourceService,
  correlationId,
  payload,
  occurredAt=new Date().toISOString()
}){
  if(!eventId||!eventType||!sourceService||!correlationId)
    throw new Error("Invalid event envelope");

  return {
    eventId,
    eventType,
    schemaVersion,
    sourceService,
    correlationId,
    occurredAt,
    payload:payload||{}
  };
}

function validate(schema,event){
  if(!schema||schema.type!=="object")
    return {valid:false,errors:["Unsupported schema"]};

  const errors=[];

  for(const field of schema.required||[]){
    if(event.payload?.[field]===undefined)
      errors.push(`Missing required field: ${field}`);
  }

  for(const [field,definition] of Object.entries(schema.properties||{})){
    const value=event.payload?.[field];
    if(value===undefined)continue;

    if(definition.type==="string"&&typeof value!=="string")
      errors.push(`Field ${field} must be string`);

    if(definition.type==="number"&&typeof value!=="number")
      errors.push(`Field ${field} must be number`);

    if(definition.type==="boolean"&&typeof value!=="boolean")
      errors.push(`Field ${field} must be boolean`);
  }

  return {valid:errors.length===0,errors};
}

module.exports={envelope,validate};
