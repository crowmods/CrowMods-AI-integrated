const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calculateTrend
}=require("../src/control-trends");

test("improving trend is detected",()=>{
  const result=calculateTrend([
    90,93,95
  ]);

  assert.equal(
    result.trend,
    "IMPROVING"
  );
});

test("declining trend is detected",()=>{
  const result=calculateTrend([
    99,96,94
  ]);

  assert.equal(
    result.trend,
    "DECLINING"
  );
});
