const test=require("node:test");
const assert=require("node:assert/strict");
const {
  targetResult,
  certification
}=require("../src/dr");

test("RTO and RPO targets pass",()=>{
  const result=targetResult({
    rtoSeconds:60,
    rpoSeconds:20,
    rtoTargetSeconds:120,
    rpoTargetSeconds:60
  });

  assert.equal(result.passed,true);
});

test("DR certification requires every gate",()=>{
  const result=certification({
    snapshotValid:true,
    restoreValid:true,
    integrityValid:true,
    providerReconnectValid:true,
    rtoPass:true,
    rpoPass:true
  });

  assert.equal(result.certified,true);
});
