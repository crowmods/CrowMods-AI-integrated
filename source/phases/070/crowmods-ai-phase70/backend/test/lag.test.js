const test=require("node:test");
const assert=require("node:assert/strict");
const {lagSeverity,shouldAlert}=require("../src/lag");

test("lag above threshold alerts",()=>{
  assert.equal(shouldAlert(101,100),true);
});

test("very high lag is critical",()=>{
  assert.equal(lagSeverity(1000,100),"CRITICAL");
});
