const {authorize,buildHandler}=require("./retention-authorizer");

function buildExecutionPlan({
  role,
  action="DRY_RUN",
  table,
  retentionDays=30,
  batchSize=100
}){
  if(!authorize({role,action}))
    return {status:"DENIED",reason:"retention_permission_denied"};

  let handler;
  try{ handler=buildHandler(table); }
  catch{
    return {status:"DENIED",reason:"table_not_allowlisted"};
  }

  return {
    status:"AUTHORIZED",
    action,
    table,
    handler,
    retentionDays:Math.max(1,Number(retentionDays)||30),
    batchSize:Math.min(1000,Math.max(1,Number(batchSize)||100))
  };
}

module.exports={buildExecutionPlan};
