const test=require("node:test");
const assert=require("node:assert/strict");
const {
  timelineEvent,
  sortTimeline
}=require("../src/timeline");

test("timeline events are sortable",()=>{
  const a=timelineEvent({
    eventType:"A",
    actor:"one",
    description:"first"
  });

  const b=timelineEvent({
    eventType:"B",
    actor:"two",
    description:"second"
  });

  const result=sortTimeline([b,a]);

  assert.equal(result.length,2);
  assert.equal(result[0].eventType,"A");
});
