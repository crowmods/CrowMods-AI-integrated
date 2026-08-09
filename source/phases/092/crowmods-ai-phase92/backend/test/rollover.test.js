const test=require("node:test");
const assert=require("node:assert/strict");
const {
  rolloverDiff,
  shouldRefresh
}=require("../src/rollover");

test("rollover detects added and removed keys",()=>{
  const result=rolloverDiff(
    [{kid:"old"}],
    [{kid:"new"}]
  );

  assert.deepEqual(result.added,["new"]);
  assert.deepEqual(result.removed,["old"]);
});

test("unknown key triggers refresh",()=>{
  assert.equal(
    shouldRefresh({
      keyFound:false,
      ageMs:0,
      ttlMs:300000
    }),
    true
  );
});
