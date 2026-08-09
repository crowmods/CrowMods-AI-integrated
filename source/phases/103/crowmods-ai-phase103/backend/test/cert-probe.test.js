const test=require("node:test");
const assert=require("node:assert/strict");
const {inspectCertificate}=require("../src/cert-probe");

test("healthy certificate passes",()=>{
  assert.equal(
    inspectCertificate({
      daysRemaining:120
    }).status,
    "PASS"
  );
});

test("expired certificate fails",()=>{
  assert.equal(
    inspectCertificate({
      daysRemaining:0
    }).status,
    "FAIL"
  );
});
