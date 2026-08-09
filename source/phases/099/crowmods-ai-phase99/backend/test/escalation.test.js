const test=require("node:test");
const assert=require("node:assert/strict");
const {
  escalationLevel,
  buildEscalation
}=require("../src/escalation");

test("critical alerts receive highest escalation",()=>{
  assert.equal(
    escalationLevel("CRITICAL"),
    3
  );
});

test("high alert creates escalation",()=>{
  const result=buildEscalation({
    alertId:"a1",
    severity:"HIGH",
    reason:"Suspicious activity"
  });

  assert.equal(result.required,true);
  assert.equal(result.escalationLevel,2);
});
