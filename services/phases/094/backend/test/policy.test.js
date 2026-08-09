const test=require("node:test");
const assert=require("node:assert/strict");
const {
  normalizeRoles,
  roleMatch,
  evaluatePolicies
}=require("../src/policy");

test("roles are normalized",()=>{
  assert.deepEqual(
    normalizeRoles(["ops","ops","viewer"]),
    ["ops","viewer"]
  );
});

test("any matching required role is sufficient",()=>{
  assert.equal(
    roleMatch(
      ["viewer","ops.viewer"],
      ["ops.admin","ops.viewer"]
    ),
    true
  );
});

test("matching allow policy grants access",()=>{
  const result=evaluatePolicies({
    identity:{
      authenticated:true,
      roles:["ops.admin"]
    },
    resource:"incident",
    action:"resolve",
    policies:[{
      policy_name:"incident-resolve",
      resource:"incident",
      action:"resolve",
      requiredRoles:["ops.admin"],
      effect:"ALLOW",
      enabled:true,
      priority:10
    }]
  });

  assert.equal(result.allowed,true);
  assert.equal(result.reason,"policy_allow");
});

test("default deny applies without policy",()=>{
  const result=evaluatePolicies({
    identity:{
      authenticated:true,
      roles:["ops.admin"]
    },
    resource:"billing",
    action:"export",
    policies:[]
  });

  assert.equal(result.allowed,false);
  assert.equal(result.reason,"default_deny");
});

test("explicit deny wins at the matching priority",()=>{
  const result=evaluatePolicies({
    identity:{
      authenticated:true,
      roles:["ops.admin"]
    },
    resource:"incident",
    action:"delete",
    policies:[{
      policy_name:"deny-delete",
      resource:"incident",
      action:"delete",
      requiredRoles:["ops.admin"],
      effect:"DENY",
      enabled:true,
      priority:1
    }]
  });

  assert.equal(result.allowed,false);
  assert.equal(result.reason,"explicit_deny");
});
