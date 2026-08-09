const test=require("node:test");
const assert=require("node:assert/strict");
const {EventBus}=require("../src/bus");

test("event bus publishes to subscribers",async()=>{
  const bus=new EventBus();
  let received=null;

  bus.subscribe("SERVICE_FAILED",event=>{
    received=event;
  });

  const event=await bus.publish({
    eventType:"SERVICE_FAILED",
    sourceService:"api",
    payload:{status:503}
  });

  assert.equal(received.eventId,event.eventId);
  assert.equal(received.payload.status,503);
});
