const test=require("node:test");
const assert=require("node:assert/strict");
const {
  normalizeEvent,
  DevelopmentSiemAdapter
}=require("../src/siem");

test("SIEM event is normalized",()=>{
  const event=normalizeEvent({
    eventType:"AUTHZ_DENIED",
    severity:"HIGH",
    correlationId:"req-1"
  });

  assert.equal(event.eventType,"AUTHZ_DENIED");
  assert.equal(event.correlationId,"req-1");
});

test("development SIEM adapter accepts events",async()=>{
  const adapter=new DevelopmentSiemAdapter();

  const result=await adapter.send({
    eventType:"TEST",
    correlationId:"x"
  });

  assert.equal(result.delivered,true);
  assert.equal(adapter.events.length,1);
});
