const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateIngestionEvent,
  deduplicateEvents
}=require("../src/timeline-ingestion");

test("valid event is accepted",()=>{
  const result=validateIngestionEvent({
    source:"siem",
    eventType:"ALERT",
    eventTime:"2026-01-01T00:00:00Z",
    sourceEventId:"evt-1"
  });

  assert.equal(result.status,"ACCEPTED");
});

test("duplicate source event is removed",()=>{
  const result=deduplicateEvents([
    {
      source:"siem",
      sourceEventId:"evt-1"
    },
    {
      source:"siem",
      sourceEventId:"evt-1"
    }
  ]);

  assert.equal(result.length,1);
});
