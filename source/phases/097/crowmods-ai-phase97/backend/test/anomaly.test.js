const test=require("node:test");
const assert=require("node:assert/strict");
const {
  scorePrivilegedAction
}=require("../src/anomaly");

test("high-volume privileged activity scores higher",()=>{
  const result=scorePrivilegedAction({
    actionCountLastHour:120,
    deniedCountLastHour:8,
    unusualResource:true,
    afterHours:true
  });

  assert.equal(result.severity,"CRITICAL");
  assert.equal(result.score>=70,true);
});

test("normal activity stays low",()=>{
  const result=scorePrivilegedAction({
    actionCountLastHour:2
  });

  assert.equal(result.severity,"LOW");
});
