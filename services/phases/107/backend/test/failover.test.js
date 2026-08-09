const test=require("node:test");
const assert=require("node:assert/strict");
const {
  evaluateProvider,
  recoveryState
}=require("../src/failover");

test("healthy primary remains active",()=>{
  const result=evaluateProvider({
    primaryHealthy:true,
    fallbackAvailable:true
  });

  assert.equal(
    result.state,
    "PRIMARY_HEALTHY"
  );
  assert.equal(
    result.allowSensitiveOperations,
    true
  );
});

test("critical provider failure fails closed",()=>{
  const result=evaluateProvider({
    primaryHealthy:false,
    fallbackAvailable:true,
    securityCritical:true
  });

  assert.equal(
    result.state,
    "FAIL_CLOSED"
  );
  assert.equal(
    result.allowSensitiveOperations,
    false
  );
});

test("recovery requires revalidation",()=>{
  assert.equal(
    recoveryState({
      primaryHealthy:true
    }).action,
    "revalidate_before_restore"
  );
});
