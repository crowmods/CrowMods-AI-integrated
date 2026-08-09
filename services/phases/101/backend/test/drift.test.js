const test=require("node:test");
const assert=require("node:assert/strict");
const {
  detectDrift
}=require("../src/drift");

test("matching state has no drift",()=>{
  assert.equal(
    detectDrift(
      {a:1,b:2},
      {b:2,a:1}
    ),
    false
  );
});

test("different state is detected",()=>{
  assert.equal(
    detectDrift(
      {a:1},
      {a:2}
    ),
    true
  );
});
