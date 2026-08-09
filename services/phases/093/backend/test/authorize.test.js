const test=require("node:test");
const assert=require("node:assert/strict");
const {
  authorize,
  hasAnyRole
}=require("../src/authorize");

test("matching role is allowed",()=>{
  assert.equal(
    hasAnyRole(
      ["ops.viewer"],
      ["ops.viewer"]
    ),
    true
  );
});

test("missing role is denied",()=>{
  const result=authorize({
    identity:{
      authenticated:true,
      roles:["viewer"]
    },
    requiredRoles:["ops.admin"]
  });

  assert.equal(result.allowed,false);
  assert.equal(result.reason,"role_denied");
});

test("unauthenticated request is rejected",()=>{
  const result=authorize({
    identity:null,
    requiredRoles:["ops"]
  });

  assert.equal(result.reason,"not_authenticated");
});
