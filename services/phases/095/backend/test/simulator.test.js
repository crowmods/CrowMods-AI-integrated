const test=require("node:test");
const assert=require("node:assert/strict");
const {
  simulateAuthorization
}=require("../src/simulator");

test("simulation uses inherited role",()=>{
  const result=simulateAuthorization({
    identity:{
      authenticated:true,
      roles:["ops.admin"]
    },
    resource:"incident",
    action:"view",
    roleMap:{
      "ops.admin":{
        parentRole:"ops.viewer"
      }
    },
    policies:[{
      id:"p1",
      resource:"incident",
      action:"view",
      requiredRoles:["ops.viewer"],
      effect:"ALLOW",
      enabled:true,
      priority:10
    }]
  });

  assert.equal(result.allowed,true);
  assert.equal(result.simulated,true);
});
