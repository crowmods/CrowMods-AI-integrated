const test=require("node:test");
const assert=require("node:assert/strict");
const {
  authorizeReview,
  paginate
}=require("../src/alert-review-access");

test("operator can view",()=>{
  assert.equal(
    authorizeReview({
      role:"operator",
      action:"VIEW"
    }).allowed,
    true
  );
});

test("viewer cannot export",()=>{
  assert.equal(
    authorizeReview({
      role:"viewer",
      action:"EXPORT"
    }).allowed,
    false
  );
});

test("pagination is capped",()=>{
  const r=paginate({page:2,pageSize:1000});
  assert.equal(r.pageSize,100);
  assert.equal(r.offset,100);
});
