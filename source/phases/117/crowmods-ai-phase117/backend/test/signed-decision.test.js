const test=require("node:test");
const assert=require("node:assert/strict");
const {
  signDecisionEvidence,
  DevelopmentDecisionSigner
}=require("../src/signed-decision");

test("decision evidence receives signature",()=>{
  const result=signDecisionEvidence({
    decision:{
      decision:"MITIGATE",
      riskId:"risk-1"
    },
    evidence:[
      {ref:"EV-1"}
    ],
    signer:new DevelopmentDecisionSigner("test")
  });

  assert.equal(result.digest.length,64);
  assert.equal(result.signature.length>0,true);
});
