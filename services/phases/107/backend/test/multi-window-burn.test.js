const test=require("node:test");
const assert=require("node:assert/strict");
const {
  evaluateWindows
}=require("../src/multi-window-burn");

test("multi-window evaluation returns all windows",()=>{
  const result=evaluateWindows({
    targetPercent:99,
    observedSuccessPercent:98
  });

  assert.equal(result.length,3);
  assert.deepEqual(
    result.map(x=>x.window),
    ["short","medium","long"]
  );
});

test("high burn triggers alerts",()=>{
  const result=evaluateWindows({
    targetPercent:99,
    observedSuccessPercent:90
  });

  assert.equal(
    result.some(x=>x.status==="ALERT"),
    true
  );
});
