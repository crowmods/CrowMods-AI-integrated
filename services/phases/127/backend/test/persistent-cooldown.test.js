const test=require("node:test");
const assert=require("node:assert/strict");
const {persistentCooldown}=require("../src/persistent-cooldown");

test("persistent failures enter cooldown",()=>{
  const r=persistentCooldown({
    state:"ROLLBACK",
    failureStreak:1,
    healthScore:.2,
    now:"2027-01-01T00:00:00Z"
  });
  assert.equal(r.state,"COOLDOWN");
});

test("recovery streak reaches stable",()=>{
  const r=persistentCooldown({
    state:"RECOVERY",
    recoveryStreak:2,
    healthScore:.9
  });
  assert.equal(r.state,"STABLE");
});
