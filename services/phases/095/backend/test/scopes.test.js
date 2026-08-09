const test=require("node:test");
const assert=require("node:assert/strict");
const {
  scopeMatches,
  hasScopedPermission
}=require("../src/scopes");

test("scope matches resource and action",()=>{
  assert.equal(
    scopeMatches({
      scope:{
        resource:"incident",
        action:"acknowledge",
        enabled:true
      },
      resource:"incident",
      action:"acknowledge"
    }),
    true
  );
});

test("role scope grants matching permission",()=>{
  assert.equal(
    hasScopedPermission({
      effectiveRoles:["ops.viewer"],
      roleScopes:[{
        role:"ops.viewer",
        resource:"incident",
        action:"view",
        enabled:true
      }],
      resource:"incident",
      action:"view"
    }),
    true
  );
});
