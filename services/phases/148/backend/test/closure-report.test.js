const test=require("node:test");
const assert=require("node:assert/strict");
const {buildReport}=require("../src/closure-report");

test("verification report gets hash",()=>{
 const r=buildReport({
  quarantineId:"q1",
  verification:{
   valid:true,
   length:4,
   headHash:"abc"
  },
  verifiedBy:"operator"
 });
 assert.equal(r.status,"READY");
 assert.equal(r.reportHash.length,64);
});
