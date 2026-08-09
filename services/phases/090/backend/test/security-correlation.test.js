const test=require("node:test");
const assert=require("node:assert/strict");
const {
  correlateSecurityEvents
}=require("../src/security-correlation");

test("repeated denied events are suspicious",()=>{
  const result=correlateSecurityEvents([
    {allowed:false,severity:"WARNING"},
    {allowed:false,severity:"WARNING"},
    {allowed:false,severity:"WARNING"}
  ]);

  assert.equal(result.suspicious,true);
  assert.equal(result.deniedCount,3);
});

test("critical event is suspicious",()=>{
  const result=correlateSecurityEvents([
    {allowed:true,severity:"CRITICAL"}
  ]);

  assert.equal(result.suspicious,true);
});
