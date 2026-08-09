const test=require("node:test");
const assert=require("node:assert/strict");
const {
  expandRoleHierarchy,
  effectiveRoles
}=require("../src/roles");

test("role hierarchy expands to parent",()=>{
  const roles=expandRoleHierarchy({
    role:"ops.admin",
    roleMap:{
      "ops.admin":{
        parentRole:"ops.viewer"
      }
    }
  });

  assert.deepEqual(
    roles,
    ["ops.admin","ops.viewer"]
  );
});

test("effective roles include inherited roles",()=>{
  const roles=effectiveRoles({
    roles:["ops.admin"],
    roleMap:{
      "ops.admin":{
        parentRole:"ops.viewer"
      },
      "ops.viewer":{
        parentRole:"ops.read"
      }
    }
  });

  assert.deepEqual(
    roles.sort(),
    ["ops.admin","ops.read","ops.viewer"].sort()
  );
});
