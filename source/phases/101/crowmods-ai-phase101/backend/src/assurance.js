const crypto=require("crypto");
const {detectDrift}=require("./drift");

function evidenceHash(value){
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function evaluateControl({
  expectedState,
  observedState,
  enabled=true
}){
  if(!enabled)
    return {
      status:"BLOCKED",
      reason:"control_disabled"
    };

  if(detectDrift(
    expectedState||{},
    observedState||{}
  )){
    return {
      status:"DRIFT",
      reason:"observed_state_differs"
    };
  }

  return {
    status:"PASS",
    reason:"state_matches"
  };
}

function summarize(results){
  const summary={
    passed:0,
    drifted:0,
    failed:0,
    blocked:0
  };

  for(const result of results){
    if(result.status==="PASS") summary.passed++;
    else if(result.status==="DRIFT") summary.drifted++;
    else if(result.status==="FAIL") summary.failed++;
    else if(result.status==="BLOCKED") summary.blocked++;
  }

  return {
    ...summary,
    status:
      summary.failed>0
        ?"FAIL"
        :summary.drifted>0
          ?"DRIFT"
          :summary.blocked>0
            ?"BLOCKED"
            :"PASS"
  };
}

module.exports={
  evidenceHash,
  evaluateControl,
  summarize
};
