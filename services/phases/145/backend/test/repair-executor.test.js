const test=require("node:test");
const assert=require("node:assert/strict");
const {executeRepair}=require("../src/repair-executor");

test("repair executes before retry limit",()=>{
 const r=executeRepair({attempt:1,maxAttempts:3,repairable:true});
 assert.equal(r.outcome,"REPAIRED");
});

test("non-repairable item is rejected",()=>{
 const r=executeRepair({attempt:1,maxAttempts:3,repairable:false});
 assert.equal(r.outcome,"REJECTED");
});
