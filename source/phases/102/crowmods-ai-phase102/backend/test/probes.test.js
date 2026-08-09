const test=require("node:test");
const assert=require("node:assert/strict");
const {
  normalizeProbeResult,
  severityForStatus
}=require("../src/probes");

test("valid probe result is normalized",()=>{
  const result=normalizeProbeResult({
    probeType:"DATABASE",
    status:"PASS"
  });

  assert.equal(result.status,"PASS");
});

test("failed probe receives high severity",()=>{
  assert.equal(
    severityForStatus("FAIL"),
    "HIGH"
  );
});
