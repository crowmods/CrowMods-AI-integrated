const test=require("node:test");
const assert=require("node:assert/strict");
const {buildReviewQuery}=require("../src/alert-review");

test("review query uses parameterized filters",()=>{
  const r=buildReviewQuery({
    reviewer:"operator",
    fingerprint:"fp",
    actionFilter:"ACKNOWLEDGED"
  });
  assert.equal(r.params.length,2);
  assert.equal(r.sql.includes("$1"),true);
  assert.equal(r.sql.includes("$2"),true);
});
