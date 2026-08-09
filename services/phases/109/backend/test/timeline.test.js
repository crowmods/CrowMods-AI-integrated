const test=require("node:test");
const assert=require("node:assert/strict");
const {
  buildTimeline,
  addEvent
}=require("../src/timeline");

test("timeline sorts chronologically",()=>{
  const result=buildTimeline([
    {timestamp:"2026-01-01T02:00:00Z"},
    {timestamp:"2026-01-01T01:00:00Z"}
  ]);

  assert.equal(
    result[0].timestamp,
    "2026-01-01T01:00:00.000Z"
  );
});

test("event can be added",()=>{
  const result=addEvent({
    events:[],
    type:"INCIDENT_OPENED",
    timestamp:"2026-01-01T01:00:00Z",
    source:"monitoring",
    summary:"Incident opened"
  });

  assert.equal(
    result.length,
    1
  );
});
