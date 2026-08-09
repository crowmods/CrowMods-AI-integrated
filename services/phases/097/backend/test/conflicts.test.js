const test=require("node:test");
const assert=require("node:assert/strict");
const {
  analyzePolicyConflicts
}=require("../src/conflicts");

test("opposing policies with same roles conflict",()=>{
  const result=analyzePolicyConflicts([
    {
      id:"a",
      resource:"incident",
      action:"delete",
      requiredRoles:["ops.admin"],
      effect:"ALLOW",
      enabled:true
    },
    {
      id:"b",
      resource:"incident",
      action:"delete",
      requiredRoles:["ops.admin"],
      effect:"DENY",
      enabled:true
    }
  ]);

  assert.equal(result.length,1);
  assert.equal(
    result[0].severity,
    "HIGH"
  );
});
