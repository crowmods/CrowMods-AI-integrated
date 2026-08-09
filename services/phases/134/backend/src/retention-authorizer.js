const ALLOWLIST={
  "alert_ack_history":{
    keyColumn:"id",
    dateColumn:"created_at"
  },
  "retry_latency_samples":{
    keyColumn:"id",
    dateColumn:"created_at"
  },
  "alert_review_queries":{
    keyColumn:"id",
    dateColumn:"created_at"
  }
};

const ROLES={
  retention_admin:new Set(["PURGE"]),
  security_admin:new Set(["PURGE"]),
  auditor:new Set(["DRY_RUN"])
};

function authorize({role,action}){
  const p=ROLES[role];
  return !!p && p.has(action);
}

function buildHandler(table){
  const handler=ALLOWLIST[table];
  if(!handler) throw new Error("table_not_allowlisted");
  return {
    table,
    keyColumn:handler.keyColumn,
    dateColumn:handler.dateColumn
  };
}

module.exports={ALLOWLIST,authorize,buildHandler};
