const test=require("node:test");
const assert=require("node:assert/strict");
const {
  availability,
  burnRate,
  multiWindowBreach,
  sloStatus
}=require("../src/slo");

test("availability is calculated correctly",()=>{
  assert.equal(
    availability(990,1000),
    .99
  );
});

test("burn rate is above one when budget is exceeded",()=>{
  assert.equal(
    burnRate({
      targetAvailability:.99,
      goodEvents:980,
      totalEvents:1000
    })>1,
    true
  );
});

test("critical multi-window breach requires both windows",()=>{
  const result=multiWindowBreach({
    fastBurn:15,
    slowBurn:2
  });

  assert.equal(result.critical,true);
});

test("healthy SLO has healthy status",()=>{
  assert.equal(
    sloStatus({
      fastBurn:0,
      slowBurn:0
    }),
    "HEALTHY"
  );
});
