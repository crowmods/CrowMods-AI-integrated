const test=require("node:test");
const assert=require("node:assert/strict");
const {
  evaluateRule,
  alertSeverity
}=require("../src/slo-alerts");

test("SLO rule detects breach",()=>{
  const result=evaluateRule({
    fastBurn:15,
    slowBurn:.5,
    fastThreshold:14,
    slowThreshold:1
  });

  assert.equal(result.breached,true);
  assert.equal(result.critical,false);
});

test("both windows produce critical alert",()=>{
  const result=evaluateRule({
    fastBurn:15,
    slowBurn:2,
    fastThreshold:14,
    slowThreshold:1
  });

  assert.equal(result.critical,true);
  assert.equal(
    alertSeverity({
      ...result,
      configuredSeverity:"HIGH"
    }),
    "CRITICAL"
  );
});
