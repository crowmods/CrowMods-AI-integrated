const test=require("node:test");
const assert=require("node:assert/strict");
const {MemoryBroker}=require("../src/broker");

test("memory broker publishes and fetches",async()=>{
  const broker=new MemoryBroker();

  await broker.createTopic("events",2);

  const result=await broker.publish(
    "events",
    "service-a",
    {eventId:"1"}
  );

  const events=await broker.fetch(
    "events",
    result.partition,
    result.offset,
    10
  );

  assert.equal(events.length,1);
  assert.equal(events[0].event.eventId,"1");
});

test("broker commit returns offset",async()=>{
  const broker=new MemoryBroker();

  const result=await broker.commit(
    "events",0,"group-a",42
  );

  assert.equal(result.offset,42);
});
