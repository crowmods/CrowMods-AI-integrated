const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calculateAssurance
}=require("../src/assurance-score");

test("strong assurance score is calculated",()=>{
  const result=calculateAssurance({
    evidenceScore:95,
    controlScore:96,
    governanceScore:94,
    reliabilityScore:97,
    riskScore:92
  });

  assert.equal(result.status,"STRONG");
  assert.equal(result.score>90,true);
});

test("missing score data is rejected",()=>{
  const result=calculateAssurance({
    evidenceScore:95,
    controlScore:null,
    governanceScore:94,
    reliabilityScore:97,
    riskScore:92
  });

  assert.equal(result.status,"INSUFFICIENT_DATA");
});
