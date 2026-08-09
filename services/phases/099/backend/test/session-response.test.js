const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateSessionResponse
}=require("../src/session-response");

test("session suspension requires reason",()=>{
  assert.equal(
    validateSessionResponse({
      action:"SUSPEND",
      reason:"Contain suspicious activity"
    }).valid,
    true
  );
});

test("invalid session action is rejected",()=>{
  assert.equal(
    validateSessionResponse({
      action:"DELETE",
      reason:"test"
    }).valid,
    false
  );
});
