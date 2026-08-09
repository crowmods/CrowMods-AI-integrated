const test=require("node:test");
const assert=require("node:assert/strict");
const {calculateRate}=require("../src/lease-conflict-rate");

test("high conflict rate breaches",()=>{
 const r=calculateRate({
  conflictCount:20,
  requestCount:100,
  threshold:.05
 });
 assert.equal(r.conflictRate,.2);
 assert.equal(r.state,"BREACH");
});
