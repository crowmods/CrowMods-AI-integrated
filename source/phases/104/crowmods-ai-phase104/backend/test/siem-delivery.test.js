const test=require("node:test");
const assert=require("node:assert/strict");
const {
  buildAuthenticatedEvent,
  deliveryPolicy
}=require("../src/siem-delivery");

test("SIEM payload requires authentication",()=>{
  const result=buildAuthenticatedEvent({
    eventId:"event-1",
    payload:{severity:"HIGH"},
    accessToken:"token"
  });

  assert.equal(
    result.headers.authorization,
    "Bearer token"
  );
});

test("temporary delivery failure retries",()=>{
  const result=deliveryPolicy({
    attempt:1,
    maxAttempts:3,
    statusCode:503
  });

  assert.equal(result.retry,true);
});

test("successful delivery does not retry",()=>{
  const result=deliveryPolicy({
    attempt:1,
    maxAttempts:3,
    statusCode:202
  });

  assert.equal(result.status,"DELIVERED");
  assert.equal(result.retry,false);
});
