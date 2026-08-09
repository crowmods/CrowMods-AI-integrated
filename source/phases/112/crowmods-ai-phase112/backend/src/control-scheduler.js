const FREQUENCIES=new Set([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY"
]);

function nextRun(frequency,from=new Date()){
  const date=new Date(from);

  if(Number.isNaN(date.getTime()))
    throw new Error("invalid_schedule_date");

  if(frequency==="DAILY")
    date.setUTCDate(date.getUTCDate()+1);
  else if(frequency==="WEEKLY")
    date.setUTCDate(date.getUTCDate()+7);
  else if(frequency==="MONTHLY")
    date.setUTCMonth(date.getUTCMonth()+1);
  else if(frequency==="QUARTERLY")
    date.setUTCMonth(date.getUTCMonth()+3);
  else
    throw new Error("unsupported_frequency");

  return date.toISOString();
}

function validateSchedule({
  frequency,
  owner
}){
  if(!FREQUENCIES.has(frequency)||!owner)
    return {
      status:"BLOCKED",
      reason:"invalid_schedule"
    };

  return {
    status:"VALID",
    frequency,
    owner
  };
}

module.exports={
  FREQUENCIES,
  nextRun,
  validateSchedule
};
