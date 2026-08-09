const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateCanary
}=require("../src/canary-replay");

test("healthy canary passes",()=>{
  const result=validateCanary({
    deadLetter:{status:"OPEN"},
    replayKey:"canary-1",
    checks:{
      schemaValid:true,
      dependenciesHealthy:true,
      targetAvailable:true
    }
  });

  assert.equal(result.status,"PASSED");
});

test("failed dependency blocks canary",()=>{
  const result=validateCanary({
    deadLetter:{status:"OPEN"},
    replayKey:"canary-2",
    checks:{
      schemaValid:true,
      dependenciesHealthy:false,
      targetAvailable:true
    }
  });

  assert.equal(result.status,"FAILED");
});
