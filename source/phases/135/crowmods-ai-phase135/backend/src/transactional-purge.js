const {authorize,buildHandler}=require("./retention-authorizer");

function authorizePurge({role,table,action="PURGE"}){
  if(!authorize({role,action}))
    return {status:"DENIED",reason:"retention_permission_denied"};
  try{
    return {status:"AUTHORIZED",handler:buildHandler(table),action};
  }catch{
    return {status:"DENIED",reason:"table_not_allowlisted"};
  }
}

function buildPurgeAudit({
  runId,table,recordKey,action,actor
}){
  if(!runId||!table||recordKey===undefined||!actor)
    return {status:"REJECTED"};
  return {
    status:"READY",
    runId,table,
    recordKey:String(recordKey),
    action,actor
  };
}

module.exports={authorizePurge,buildPurgeAudit};
