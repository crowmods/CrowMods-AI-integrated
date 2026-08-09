const test=require("node:test");
const assert=require("node:assert/strict");
const {
  certificateStatus
}=require("../src/certificate");

test("healthy certificate passes",()=>{
  assert.equal(
    certificateStatus({
      daysRemaining:90
    }).status,
    "PASS"
  );
});

test("near-expiry certificate warns",()=>{
  assert.equal(
    certificateStatus({
      daysRemaining:5
    }).status,
    "WARN"
  );
});

test("expired certificate fails",()=>{
  assert.equal(
    certificateStatus({
      daysRemaining:0
    }).status,
    "FAIL"
  );
});
