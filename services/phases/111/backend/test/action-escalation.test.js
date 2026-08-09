const test=require("node:test");
const assert=require("node:assert/strict");
const {
  createEscalation
}=require("../src/action-escalation");

test("critical overdue action reaches executive escalation",()=>{
  const result=createEscalation({
    status:"OVERDUE",
    severity:"CRITICAL",
    hoursOverdue:80
  });

  assert.equal(result.level,3);
  assert.equal(result.target,"SECURITY_EXECUTIVE");
});

test("on-track action does not escalate",()=>{
  assert.equal(
    createEscalation({
      status:"ON_TRACK",
      severity:"INFO"
    }).level,
    0
  );
});
