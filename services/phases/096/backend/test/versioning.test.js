const test=require("node:test");
const assert=require("node:assert/strict");
const {
  nextVersion,
  versionState,
  rollbackTarget
}=require("../src/versioning");

test("next version increments",()=>{
  assert.equal(
    nextVersion([
      {versionNumber:1},
      {versionNumber:4}
    ]),
    5
  );
});

test("policy state is normalized",()=>{
  const state=versionState({
    resource:"incident",
    action:"resolve",
    requiredRoles:["ops.admin"],
    effect:"ALLOW",
    enabled:true,
    priority:10
  });

  assert.equal(state.resource,"incident");
  assert.deepEqual(
    state.requiredRoles,
    ["ops.admin"]
  );
});

test("rollback target is selected",()=>{
  const target=rollbackTarget(
    [{versionNumber:1},{versionNumber:2}],
    1
  );

  assert.equal(target.versionNumber,1);
});
