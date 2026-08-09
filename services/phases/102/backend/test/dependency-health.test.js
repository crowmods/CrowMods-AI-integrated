const test=require("node:test");
const assert=require("node:assert/strict");
const {
  dependencyStatus
}=require("../src/dependency-health");

test("reachable dependency passes",()=>{
  assert.equal(
    dependencyStatus({
      reachable:true,
      latencyMs:100
    }).status,
    "PASS"
  );
});

test("unreachable dependency fails",()=>{
  assert.equal(
    dependencyStatus({
      reachable:false
    }).status,
    "FAIL"
  );
});

test("slow dependency warns",()=>{
  assert.equal(
    dependencyStatus({
      reachable:true,
      latencyMs:3000
    }).status,
    "WARN"
  );
});
