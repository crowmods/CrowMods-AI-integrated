const test=require("node:test");
const assert=require("node:assert/strict");
const {
  availabilityPercent,
  evaluateSlo,
  breachSeverity
}=require("../src/slo");

test("availability is calculated",()=>{
  assert.equal(
    availabilityPercent({
      total:100,
      successful:99
    }),
    99
  );
});

test("meeting target passes",()=>{
  assert.equal(
    evaluateSlo({
      total:1000,
      successful:999,
      targetPercent:99.9
    }).status,
    "PASS"
  );
});

test("missing target performance breaches",()=>{
  assert.equal(
    evaluateSlo({
      total:1000,
      successful:950,
      targetPercent:99
    }).status,
    "BREACH"
  );
});

test("large SLO gap becomes critical",()=>{
  assert.equal(
    breachSeverity({
      targetPercent:99,
      availabilityPercent:90
    }),
    "CRITICAL"
  );
});
