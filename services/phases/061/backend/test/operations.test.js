const test=require("node:test");
const assert=require("node:assert/strict");
const {checklistReady,evaluateSlo}=require("../src/operations");

test("completed checklist is ready",()=>{
  assert.equal(checklistReady([
    {required:true,completed:true},
    {required:true,completed:true}
  ]),true);
});

test("incomplete checklist is blocked",()=>{
  assert.equal(checklistReady([
    {required:true,completed:true},
    {required:true,completed:false}
  ]),false);
});

test("healthy SLO recommends continue",()=>{
  const r=evaluateSlo({
    errorRate:.001,
    latencyMs:250,
    healthPassRate:1
  });
  assert.equal(r.recommendation,"CONTINUE");
});

test("bad SLO recommends investigation",()=>{
  const r=evaluateSlo({
    errorRate:.05,
    latencyMs:250,
    healthPassRate:1
  });
  assert.equal(r.recommendation,"INVESTIGATE_OR_ROLLBACK");
});
