const test=require("node:test");
const assert=require("node:assert/strict");
const {
  evaluateControl,
  summarize
}=require("../src/assurance");

test("matching control passes",()=>{
  assert.equal(
    evaluateControl({
      expectedState:{enabled:true},
      observedState:{enabled:true}
    }).status,
    "PASS"
  );
});

test("changed state becomes drift",()=>{
  assert.equal(
    evaluateControl({
      expectedState:{enabled:true},
      observedState:{enabled:false}
    }).status,
    "DRIFT"
  );
});

test("summary reports drift",()=>{
  const result=summarize([
    {status:"PASS"},
    {status:"DRIFT"}
  ]);

  assert.equal(result.drifted,1);
  assert.equal(result.status,"DRIFT");
});
