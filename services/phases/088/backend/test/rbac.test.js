const test=require("node:test");
const assert=require("node:assert/strict");
const {
  permissions,
  can,
  requirePermission
}=require("../src/rbac");

test("operator can acknowledge with permission",()=>{
  assert.equal(
    can(
      [permissions.VIEW,permissions.ACK],
      permissions.ACK
    ),
    true
  );
});

test("operator cannot resolve without permission",()=>{
  assert.equal(
    can(
      [permissions.VIEW],
      permissions.RESOLVE
    ),
    false
  );
});

test("admin permission grants access",()=>{
  assert.equal(
    requirePermission(
      [permissions.ADMIN],
      permissions.MODIFY_SLO
    ).allowed,
    true
  );
});
